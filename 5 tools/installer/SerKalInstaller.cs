using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("SerKal Desktop Installer")]
[assembly: AssemblyDescription("SerKal Desktop installation and update")]
[assembly: AssemblyCompany("Kurt Vogelsaenger")]
[assembly: AssemblyProduct("SerKal Desktop")]
[assembly: AssemblyVersion("1.0.7.1")]
[assembly: AssemblyFileVersion("1.0.7.1")]

internal static class SerKalInstaller
{
    private const string ResourceName = "SerKal.Setup.exe";
    private const string SetupFileName = "SerKal_1.007f1_Setup.exe";
    private static readonly bool German =
        string.Equals(CultureInfo.CurrentUICulture.TwoLetterISOLanguageName, "de", StringComparison.OrdinalIgnoreCase);

    private static string T(string german, string english)
    {
        return German ? german : english;
    }

    [STAThread]
    private static int Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        try
        {
            Process[] running = FindRunningSerKal();
            if (running.Length > 0)
            {
                using (var countdown = new CountdownForm())
                {
                    if (countdown.ShowDialog() != DialogResult.OK)
                    {
                        MessageBox.Show(
                            T(
                                "Die Installation/Aktualisierung wurde abgebrochen.\r\nDie vorhandene SerKal-Installation wurde nicht verändert.",
                                "Installation/update was cancelled.\r\nThe existing SerKal installation was not changed."),
                            "SerKal Desktop",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                        return 2;
                    }
                }

                foreach (Process process in FindRunningSerKal())
                {
                    try { process.CloseMainWindow(); }
                    catch { }
                }

                DateTime deadline = DateTime.UtcNow.AddSeconds(12);
                while (DateTime.UtcNow < deadline && FindRunningSerKal().Length > 0)
                {
                    Application.DoEvents();
                    Thread.Sleep(200);
                }

                if (FindRunningSerKal().Length > 0)
                {
                    MessageBox.Show(
                        T(
                            "Installation/Aktualisierung fehlgeschlagen.\r\n\r\nSerKal Desktop konnte nicht regulär geschlossen werden. Bitte schließen Sie SerKal selbst und starten Sie diese Datei erneut.",
                            "Installation/update failed.\r\n\r\nSerKal Desktop could not be closed normally. Please close SerKal yourself and run this file again."),
                        "SerKal Desktop",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    return 3;
                }
            }

            string workFolder = Path.Combine(Path.GetTempPath(), "SerKalInstaller-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(workFolder);
            string setupPath = Path.Combine(workFolder, SetupFileName);

            try
            {
                ExtractSetup(setupPath);
                var startInfo = new ProcessStartInfo
                {
                    FileName = setupPath,
                    WorkingDirectory = workFolder,
                    UseShellExecute = true
                };
                using (Process setup = Process.Start(startInfo))
                {
                    if (setup == null) throw new InvalidOperationException(T(
                        "Das eingebettete Installationsprogramm konnte nicht gestartet werden.",
                        "The embedded installer could not be started."));
                    setup.WaitForExit();
                    if (setup.ExitCode != 0)
                    {
                        throw new InvalidOperationException(T(
                            "Das Installationsprogramm meldete Fehlercode ",
                            "The installer returned error code ") + setup.ExitCode + ".");
                    }
                }

                MessageBox.Show(
                    T(
                        "SerKal Desktop wurde erfolgreich installiert/aktualisiert.",
                        "SerKal Desktop was installed/updated successfully."),
                    "SerKal Desktop",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return 0;
            }
            finally
            {
                try { Directory.Delete(workFolder, true); }
                catch { }
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                T("Installation/Aktualisierung fehlgeschlagen.", "Installation/update failed.") + "\r\n\r\n" + ex.Message,
                "SerKal Desktop",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    private static Process[] FindRunningSerKal()
    {
        return Process.GetProcesses()
            .Where(delegate(Process process)
            {
                try
                {
                    return !process.HasExited &&
                           process.MainWindowHandle != IntPtr.Zero &&
                           process.MainWindowTitle.StartsWith("SERKAL Desktop", StringComparison.OrdinalIgnoreCase);
                }
                catch { return false; }
            })
            .ToArray();
    }

    private static void ExtractSetup(string target)
    {
        Assembly assembly = Assembly.GetExecutingAssembly();
        using (Stream source = assembly.GetManifestResourceStream(ResourceName))
        {
            if (source == null) throw new InvalidOperationException(T(
                "Das eingebettete SerKal-Setup fehlt.",
                "The embedded SerKal setup is missing."));
            using (FileStream destination = File.Create(target))
            {
                source.CopyTo(destination);
            }
        }
    }

    private sealed class CountdownForm : Form
    {
        private readonly Label message;
        private readonly Button cancel;
        private readonly System.Windows.Forms.Timer timer;
        private int seconds = 7;

        internal CountdownForm()
        {
            Text = T("SerKal Desktop aktualisieren", "Update SerKal Desktop");
            Width = 570;
            Height = 190;
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ShowInTaskbar = true;
            TopMost = true;
            Icon = SystemIcons.Application;

            message = new Label
            {
                AutoSize = false,
                Left = 24,
                Top = 25,
                Width = 505,
                Height = 58,
                Font = new Font(SystemFonts.MessageBoxFont.FontFamily, 11.5f, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter
            };
            Controls.Add(message);

            cancel = new Button
            {
                Text = T("Abbrechen", "Cancel"),
                Width = 125,
                Height = 34,
                Left = (ClientSize.Width - 125) / 2,
                Top = 96,
                DialogResult = DialogResult.Cancel
            };
            Controls.Add(cancel);
            CancelButton = cancel;

            timer = new System.Windows.Forms.Timer { Interval = 1000 };
            timer.Tick += delegate
            {
                seconds--;
                if (seconds <= 0)
                {
                    timer.Stop();
                    DialogResult = DialogResult.OK;
                    Close();
                    return;
                }
                UpdateText();
            };

            Shown += delegate { UpdateText(); timer.Start(); };
            FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                timer.Stop();
                if (DialogResult == DialogResult.None) DialogResult = DialogResult.Cancel;
            };
        }

        private void UpdateText()
        {
            message.Text = T(
                "SerKal Desktop wird automatisch geschlossen in " + seconds + " Sekunden.",
                "SerKal Desktop will close automatically in " + seconds + " seconds.");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                timer.Dispose();
                message.Dispose();
                cancel.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
