import platform
import shutil
import subprocess
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])


class OSNotificationReq(BaseModel):
    title: str = "🚨 Posture Alert!"
    body: str = "You have had poor posture for over 5 seconds. Sit up straight!"


def send_system_notification(title: str, body: str):
    system = platform.system()
    try:
        if system == "Linux":
            if shutil.which("notify-send"):
                subprocess.run(
                    ["notify-send", title, body, "-u", "critical", "-i", "dialog-warning"],
                    check=False,
                )
        elif system == "Darwin":
            script = f'display notification "{body}" with title "{title}"'
            subprocess.run(["osascript", "-e", script], check=False)
        elif system == "Windows":
            powershell_cmd = f'''
            [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
            $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
            $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Warning
            $objNotifyIcon.BalloonTipIcon = "Warning"
            $objNotifyIcon.BalloonTipText = "{body}"
            $objNotifyIcon.BalloonTipTitle = "{title}"
            $objNotifyIcon.Visible = $True
            $objNotifyIcon.ShowBalloonTip(10000)
            '''
            subprocess.run(["powershell", "-Command", powershell_cmd], check=False)
    except Exception as e:
        print(f"Failed to trigger OS notification: {e}")


@router.post("/os")
def trigger_os_notification(req: OSNotificationReq):
    send_system_notification(req.title, req.body)
    return {"status": "sent"}
