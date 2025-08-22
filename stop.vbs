' unlaunch.vbs - остановка Flask и React

Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")

' Остановка Python-процессов (Flask)
Set colProcessList = objWMIService.ExecQuery("Select * from Win32_Process Where Name = 'python.exe'")

For Each objProcess in colProcessList
    If InStr(objProcess.CommandLine, "app.py") > 0 Then
        objProcess.Terminate()
    End If
Next

' Остановка Node.js-процессов (React)
Set colProcessList = objWMIService.ExecQuery("Select * from Win32_Process Where Name = 'node.exe'")

For Each objProcess in colProcessList
    cmdLine = objProcess.CommandLine
    If Not IsNull(cmdLine) Then
        ' Ищем процессы, связанные с react-scripts
        If InStr(cmdLine, "react-scripts/scripts/start.js") > 0 Or InStr(cmdLine, "npm start") > 0 Then
            objProcess.Terminate()
        End If
    End If
Next

MsgBox "Flask server and React frontend stopped", vbExclamation, "Success"
