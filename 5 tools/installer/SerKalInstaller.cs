using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("SerKal Desktop Installer")]
[assembly: AssemblyDescription("SerKal Desktop Installation und Aktualisierung")]
[assembly: AssemblyCompany("Kurt Vogelsaenger")]
[assembly: AssemblyProduct("SerKal Desktop")]
[assembly: AssemblyVersion("1.2.0.0")]
[assembly: AssemblyFileVersion("1.2.0.0")]

internal static class SerKalInstaller
{
    private const string ResourceName = "SerKal.Setup.exe";
    private const string SetupFileName = "serkal-desktop-1-2-setup.exe";

    [STAThread]
    private static int Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        try
        {
            Process[] running = FindRunningSerKal();
            while (running.Length > 0)
            {
                BringSerKalToFront(running);
                DialogResult choice = MessageBox.Show(
                    "SerKal Desktop läuft noch. Möglicherweise wartet dort ein Dialog, zum Beispiel „Änderungen speichern“.\r\n\r\nBitte beantworten Sie zuerst alle offenen Rückfragen und schließen Sie SerKal anschließend selbst. So gehen keine ungespeicherten Änderungen verloren.\r\n\r\nDanach hier auf „Wiederholen“ klicken.",
                    "SerKal Desktop aktualisieren",
                    MessageBoxButtons.RetryCancel,
                    MessageBoxIcon.Information,
                    MessageBoxDefaultButton.Button1,
                    MessageBoxOptions.DefaultDesktopOnly);
                if (choice != DialogResult.Retry)
                {
                    MessageBox.Show(
                        "Die Installation/Aktualisierung wurde sicher abgebrochen.\r\nDie vorhandene SerKal-Installation wurde nicht verändert.",
                        "SerKal Desktop",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);
                    return 2;
                }
                running = FindRunningSerKal();
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
                    if (setup == null) throw new InvalidOperationException("Das eingebettete Installationsprogramm konnte nicht gestartet werden.");
                    setup.WaitForExit();
                    if (setup.ExitCode != 0)
                    {
                        throw new InvalidOperationException("Das Installationsprogramm meldete Fehlercode " + setup.ExitCode + ".");
                    }
                }

                MessageBox.Show(
                    "SerKal Desktop wurde erfolgreich installiert/aktualisiert.",
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
                "Installation/Aktualisierung fehlgeschlagen.\r\n\r\n" + ex.Message,
                "SerKal Desktop",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    private static void BringSerKalToFront(Process[] running)
    {
        foreach (Process process in running)
        {
            try
            {
                if (process.MainWindowHandle == IntPtr.Zero) continue;
                ShowWindowAsync(process.MainWindowHandle, 9);
                SetForegroundWindow(process.MainWindowHandle);
            }
            catch { }
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
            if (source == null) throw new InvalidOperationException("Das eingebettete SerKal-Setup fehlt.");
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
            Text = "SerKal Desktop aktualisieren";
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
                Text = "Abbrechen",
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
            message.Text = "SerKal Desktop wird automatisch geschlossen in " + seconds + " Sekunden.";
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
