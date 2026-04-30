# AdHunter Client Static Analysis

Analysis date: `2026-04-23`

This report covers a static-only analysis of the client package generated for
account `17629075264`. No executables were run during this phase.

## Package

- Download URL:
  `http://www.adhunter.cn/data/AgentData/Complete/17629075264/17629075264.zip`
- Sample path:
  `C:\Analysis\adhunter\samples\17629075264.zip`
- ZIP SHA256:
  `A2C8F1A68518B629323F6AB0998826FBFFB4B1505711522C3D487F7A89391D6B`
- ZIP size: `4,463,574` bytes

## Archive contents

Extracted path:
`C:\Analysis\adhunter\samples\17629075264\17629075264`

Files:

- `AdHunter.exe`
- `猎手简易安装工具.exe`
- `猎手安装说明.txt`

The package is very small and self-contained. No `.sys` driver files are shipped
directly in the ZIP, which suggests the main client likely unpacks embedded
resources at runtime.

## Main client: AdHunter.exe

- Path:
  `C:\Analysis\adhunter\samples\17629075264\17629075264\AdHunter.exe`
- SHA256:
  `BF17F97696211E1546B7B4F18CA9C0812C01B6B6E487C672DFDC3EE6268989D8`
- Size: `4,883,456` bytes
- Signature: `NotSigned`
- Product name: `广告猎手`
- File description: `主机防护盾`
- File version: `2.12.10.1008`
- PE type: `x64`, `PE32+`, `Windows GUI`
- CLR header: `False`
- PE timestamp (UTC): `2023-10-10 00:02:00Z`
- Overlay bytes: `0`

Section layout:

- `.text`
- `.rdata`
- `.data`
- `.pdata`
- `SelfSec`
- `.vmp0`
- `.vmp1`
- `.reloc`
- `.rsrc`

The `SelfSec`, `.vmp0`, and `.vmp1` sections strongly suggest VMProtect or a
similar protection/packing layer.

High-signal strings indicate:

- Driver/service lifecycle management:
  - `install driver success`
  - `start driver success`
  - `ChangeServiceStartType BFE to auto start`
  - `SYSTEM\\CurrentControlSet\\Services\\`
- Embedded resource unpacking:
  - `AdhRes.zip`
  - `AdhUiRes.zip`
  - `Could not unzip file`
- Rule engine categories aligned with the website model:
  - `DIR`
  - `REG`
  - `IP`
  - `CtrlWnd`
  - `AntiThread`
  - `MD5_REG`
  - `BootBat`
  - `BootBat_Group`
- Server/API paths:
  - `http://%s/index.php/client_get_data/get_agent_module/agent_name/%s/rmac/%s/os/%s?tsts=%d`
  - `http://%s/index.php/client_get_data/get_client_outer_ip/agent_name/%s/?tsts=%d`
  - `http://%s/index.php/client_get_data/get_client_param/agent_name/%s/mac/%s/?tsts=%d`
  - `http://%s/index.php/client_get_data/get_debug_rule/agent_name/%s/?tsts=%d`
  - `http://%s/index.php/client_download/download/type/%s/id/%d?tsts=%d`

Representative imports:

- `ADVAPI32.dll`: `ChangeServiceConfigW`, `OpenSCManagerW`, `EnumServicesStatusExW`, `OpenServiceW`, `QueryServiceConfigW`
- `WINHTTP.dll`: `WinHttpConnect`
- `WININET.dll`: `InternetOpenW`
- `IPHLPAPI.DLL`: `GetAdaptersInfo`
- `dbghelp.dll`: `MiniDumpWriteDump`
- `WTSAPI32.dll`: `WTSSendMessageW`
- `PSAPI.DLL`: `GetModuleFileNameExW`

Embedded payload indicators:

- `MZ` markers inside file: `24`
- `PK\x03\x04` markers inside file: `1`
- Overlay bytes: `0`

This suggests additional PE or ZIP-like payloads are embedded inside normal PE
sections rather than appended as an overlay.

Static conclusion:

- The client is a native x64 Windows program, not a .NET application.
- It appears to include its own driver/service bootstrap logic.
- It contains explicit parsers for the same rule fields exposed in the web UI.
- It contains module download logic in addition to rule application logic.

## Helper installer: 猎手简易安装工具.exe

- Path:
  `C:\Analysis\adhunter\samples\17629075264\17629075264\猎手简易安装工具.exe`
- SHA256:
  `4C19B773DBE32A84A45E54914E59D421B4F8155C744CA57BB21D4450A180A394`
- Size: `2,902,016` bytes
- Signature: `NotSigned`
- File version: `1.25.11.514`
- PE type: `x64`, `PE32+`, `Windows GUI`
- CLR header: `False`
- PE timestamp (UTC): `2025-11-05 06:12:47Z`
- Overlay bytes: `0`

The included `猎手安装说明.txt` says the helper is used to:

- Repair blocking by certain netcafe environments
- Install AdHunter into the Startup folder for diskless images
- Install through `userinit` registry startup

High-signal helper strings reinforce this:

- Startup persistence:
  - `c:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup`
  - `AdHunter.exe`
- `userinit` modification:
  - `\\Winlogon\\Userinit`
  - `Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\userinit.exe`
- Driver conflict / environment-specific repair:
  - `WxPluginAd.sys`
  - `SYSTEM\\CurrentControlSet\\services\\WxPluginAd`
  - `windrv_x64.sys`
  - `P2PSyncService.exe`

Representative imports:

- `ADVAPI32.dll`: `RegSetValueExW`, `RegQueryValueExW`, `ControlService`
- `WININET.dll`: `InternetOpenW`, `InternetConnectW`, `HttpOpenRequestW`, `HttpSendRequestW`, `InternetReadFile`
- `SHELL32.dll`: `SHCreateDirectoryExW`, `ShellExecuteW`
- `SHLWAPI.dll`: `PathFileExistsW`
- `dbghelp.dll`: `MiniDumpWriteDump`

Embedded payload indicators:

- `MZ` markers inside file: `9`
- `PK\x03\x04` markers inside file: `1`
- Overlay bytes: `0`

Static conclusion:

- The helper is not a generic installer; it appears tailored for netcafe
  diskless/offline image deployment and boot-chain persistence.
- It likely patches around conflicts with existing environment-specific drivers
  and startup mechanisms.

## Overall assessment

The downloaded package matches the product model inferred from the website:

- A main client with built-in rule parsing and driver/service control
- A helper installer focused on deployment into diskless/netcafe boot flows
- Server polling endpoints for config, modules, debug rules, and downloads

The strongest static evidence so far is that the client is not just "pulling a
text rule file". It appears to be a native local agent with:

- Driver-backed enforcement
- Rule parsers for file/registry/network/window/process classes
- Boot-script handling
- Separate module download capability
- A protected/packed native client with embedded internal payloads

## Hyper-V status

Host Hyper-V is now ready:

- `Microsoft-Hyper-V-All`: `Enabled`
- `Get-VM` and `New-VM` cmdlets are available after reboot

Current blocker for guest execution analysis:

- No trusted Windows 10/11 guest install ISO or VHDX has been identified yet on
  the local disks.
- A few boot files were found on `E:\Boot`, but that is not sufficient guest
  installation media for creating a clean analysis VM.

## Artifact paths

- Report:
  `C:\Users\Administrator\Desktop\quguanggao\STATIC_ANALYSIS_REPORT.md`
- ZIP sample:
  `C:\Analysis\adhunter\samples\17629075264.zip`
- Extracted files:
  `C:\Analysis\adhunter\samples\17629075264\17629075264`
- Main client static profile:
  `C:\Analysis\adhunter\artifacts\20260423-115238-static-AdHunter`
- Helper installer static profile:
  `C:\Analysis\adhunter\artifacts\20260423-115248-static-猎手简易安装工具`
