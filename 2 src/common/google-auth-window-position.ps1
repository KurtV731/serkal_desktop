$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class SerKalGoogleWindow {
 public delegate bool Callback(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(Callback cb,IntPtr p);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h,StringBuilder text,int n);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int mode);
 [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h,int x,int y,int width,int height,bool repaint);
}
'@
$title=$env:SERKAL_OAUTH_WINDOW_TITLE
if($title -notmatch '^SerKal Google [a-f0-9]{24}$'){throw 'Invalid SerKal window marker'}
$x=[int]$env:SERKAL_OAUTH_WINDOW_X;$y=[int]$env:SERKAL_OAUTH_WINDOW_Y
$width=[int]$env:SERKAL_OAUTH_WINDOW_WIDTH;$height=[int]$env:SERKAL_OAUTH_WINDOW_HEIGHT
for($attempt=0;$attempt -lt 100;$attempt++){
 $script:matches=New-Object 'System.Collections.Generic.List[System.IntPtr]'
 $callback=[SerKalGoogleWindow+Callback]{param($handle,$unused)
  if([SerKalGoogleWindow]::IsWindowVisible($handle)){
   $text=New-Object Text.StringBuilder 1024
   [void][SerKalGoogleWindow]::GetWindowText($handle,$text,$text.Capacity)
   if($text.ToString().StartsWith($title,[StringComparison]::Ordinal)){$script:matches.Add($handle)}
  }
  return $true
 }
 [void][SerKalGoogleWindow]::EnumWindows($callback,[IntPtr]::Zero)
 if($script:matches.Count -gt 1){throw 'Ambiguous SerKal sign-in window'}
 if($script:matches.Count -eq 1){
  $handle=$script:matches[0]
  [void][SerKalGoogleWindow]::ShowWindow($handle,9)
  if(-not [SerKalGoogleWindow]::MoveWindow($handle,$x,$y,$width,$height,$true)){throw 'SerKal window positioning failed'}
  exit 0
 }
 Start-Sleep -Milliseconds 100
}
throw 'SerKal sign-in window was not found'
