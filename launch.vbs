' launch.vbs - запуск Flask + React в фоне

Set oShell = CreateObject("WScript.Shell")

' Запуск Flask-сервера в отдельном окне
oShell.Run "cmd /c cd backend && python app.py", 0, False

' Запуск React-приложения
oShell.Run "cmd /c cd frontend && npm start", 0, False

MsgBox "Flask server started (port 5000) and React frontend (port 3000)", vbInformation, "Launch"
