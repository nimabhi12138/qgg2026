# AdHunter Guest Behavior Report

Date: `2026-04-23`
Lab VM: `AdHunterLab`

## Scope

This report summarizes guest-side execution findings after running the downloaded
client package in an isolated Hyper-V VM. The goal was to identify persistence,
kernel/user-mode modules, and evidence of cloud-delivered submodules.

## High-confidence findings

### 1. Main process name is randomized at runtime

The downloaded binary remains on disk as:

- `C:\Analysis\adhunter\17629075264\17629075264\AdHunter.exe`

But when started, the process presents itself under randomized names such as:

- `puxgwllk.exe`
- `fuhmceou.exe`

Observed sessions:

- `Session 0` when launched from PowerShell Direct
- `Session 1` when launched from the interactive desktop startup path

This indicates the file path stays fixed while the in-memory process identity is
obfuscated.

### 2. Each run installs a randomized kernel driver service

Two observed driver service names:

- `k2ayuj25q`
- `l9qtsnk`

Observed driver paths:

- `C:\Windows\o8w6m5\k2ayuj25q.sys`
- `C:\Windows\jueikzd56\l9qtsnk.sys`

Observed events:

- `Service Control Manager 7045`: kernel-mode driver service installed
- `Microsoft-Windows-FilterManager 6`: filter loaded successfully
- `AFD 16001`: TDI filter warning

Filter enumeration confirmed the active minifilter:

- Filter name: `l9qtsnk`
- Altitude: `371912`

The copied driver is signed and identifies itself as:

- Original filename: `AdDriver.sys`
- Product name: `振创网络净化中心`
- SHA256: `D322ECFA2B37F23A7510957F46FCAD5879F5A5A46A0CBD5B797E960954341EC6`

## User-mode module chain

### 3. The main process loads a hidden ControlWindow module set

Live module enumeration from the running randomized process showed:

- `C:\Windows\zz6c4gordd\Module\ControlWindow\ControlWindow.dll`

The full module directory copied from guest was:

- `ControlWindow.dll`
- `cwapi_32.dll`
- `hkthunk.dll`
- `hkthunk64.dll`
- `remote.exe`
- `GLLA.exe`
- `ControlWindow.dll.__config.ini`

All of these were unsigned.

Hash equivalence confirmed:

- `ControlWindow.dll` == dropped `vqvam_80p_x64.dll`
- `cwapi_32.dll` == dropped `vqvam_80p_x86.dll`
- `hkthunk.dll` == dropped `fora9_6e7oc1i`
- `hkthunk64.dll` == dropped `6fora9_6e7oc1i`

This means the apparently unrelated random DLL and blob files are not separate
artifacts; they are the staged ControlWindow module set.

### 4. ControlWindow is an injection/hooking subsystem

High-signal strings from `ControlWindow.dll` / `cwapi_32.dll`:

- `Hook_SetWindowPos`
- `InstallHook`
- `UninstallHook`
- `LoadInjectDllThunk`
- `ControlWindow.dll`
- `ControlWindowApi.dll`
- `CW!Intercept`
- `CW!Hook_CoCreateInstanceEx`
- `CW!SendAijDllPath`
- `ADH!CW::CopyDll`

The small `hkthunk*.dll` files contain PDB paths pointing to:

- `d:\project\zc\adblock\lmp\inject_thunk\objchk_win7_x86\i386\thunk.pdb`
- `d:\project\zc\adblock\lmp\inject_thunk\objchk_win7_amd64\amd64\thunk.pdb`

This is strong evidence that the window-control feature is backed by DLL
injection helpers rather than simple top-level window enumeration alone.

### 5. `remote.exe` contains module-routing endpoints

`remote.exe` inside the ControlWindow module directory contains:

- `http://1.adhunter.cn/index.php/client_get_data/get_ip_agent_name`
- `http://2.adhunter.cn/index.php/client_get_data/get_ip_agent_name`
- `http://3.adhunter.cn/index.php/client_get_data/get_ip_agent_name`
- `http://z.wb009.com/nav2/%s/remote.txt`
- `www.adhunter.cn`
- `LoadLibraryA`
- `CreateRemoteThread`
- `RunRemoteExe.exe`
- `ZCRemote`

This suggests a second-stage helper that can:

- resolve an agent/module choice by IP
- fetch remote instructions
- inject or remotely load user-mode components

## Cloud-delivered submodule evidence

### 6. The client downloaded a WeChat-related cleanup package

A downloaded ZIP was found in the guest Internet cache:

- `C:\Users\Administrator\AppData\Local\Microsoft\Windows\INetCache\IE\N0DY9JEA\WxPlugin[1].zip`

Contents:

- `WxPlugin.bat`

The batch script contains targeted logic for netcafe environments and removes
WeChat plugin ad components:

- `net stop wxpluginad`
- delete `wxpluginad.sys`
- delete `C:\windows\syswow64\drivers\*.dat`
- manipulate `C:\windows\syswow64\Wxplugin.sys`
- set IFEO for `P2PSyncService.exe`

It also checks multiple netcafe admin markers:

- `iCafe8`
- `EYOOCLIENTSTATUS`
- `NXD`
- `nds`

This is direct evidence that AdHunter can pull down environment-specific
remediation packages from the cloud rather than relying only on one monolithic
client binary.

### 7. `cw.dat` is likely encrypted or packed local state

The client created:

- `C:\Windows\cw.dat`

Properties:

- Length: `15288`
- SHA256: `8475A94457DDDCD035B03D76022AC5A6F3001E6B9E0BFD3A4738935612CFE2DB`

The file contains no obvious plaintext strings and begins with high-entropy
data, which suggests it is either encrypted, compressed, or a binary rule/state
blob used by the ControlWindow subsystem.

## What this means architecturally

The current evidence supports this execution model:

1. `AdHunter.exe` starts and obfuscates its runtime process identity.
2. It deploys a signed randomized minifilter driver for kernel enforcement.
3. It stages a hidden `ControlWindow` module directory under `C:\Windows\<rand>`.
4. It loads `ControlWindow.dll` into the main process and uses `hkthunk` helper
   DLLs for injection/hooking.
5. It can download scenario-specific repair/removal packages such as
   `WxPlugin.bat`.
6. It includes a remote helper that can resolve or fetch module behavior from
   multiple AdHunter endpoints.

This is significantly more than a “rule text downloader”. It is a modular
Windows control agent with:

- signed kernel enforcement
- hidden user-mode window/injection modules
- remote package delivery
- environment-specific remediation scripts
- randomized naming to reduce detection and static IOC stability

## Important artifact paths

- Host summary:
  `C:\Analysis\adhunter\artifacts\guest-first-run\summary.json`
- Startup run summary:
  `C:\Analysis\adhunter\artifacts\guest-startup-run\summary.json`
- Driver copy:
  `C:\Analysis\adhunter\artifacts\guest-drop-copy\l9qtsnk.sys`
- ControlWindow module set:
  `C:\Analysis\adhunter\artifacts\guest-drop-copy\ControlWindow`
- Downloaded WeChat cleanup ZIP:
  `C:\Analysis\adhunter\artifacts\guest-drop-copy\WxPlugin1.zip`
- Local opaque state blob:
  `C:\Analysis\adhunter\artifacts\guest-drop-copy\cw.dat`

## Next recommended step

The most valuable next step is to capture the actual cloud sync path with a
longer interactive run plus network tracing focused on:

- `*.adhunter.cn`
- `z.wb009.com`
- creation of `cw.dat`
- creation/update of `C:\Windows\<rand>\Module\*`

That should let us connect:

- client launch
- module routing
- rule/module fetch
- local ControlWindow deployment
