# AdHunter Hyper-V Analysis Runbook

This workspace contains the scripts and notes to build an isolated Hyper-V lab
for analyzing the AdHunter client in a guest VM.

## Current host status

- `Microsoft-Hyper-V-All` is enabled and Hyper-V cmdlets are now usable.
- Analysis root on the host: `C:\Analysis\adhunter`

## Recommended sequence

1. Run `scripts/Prepare-HostHyperV.ps1` to verify host readiness.
2. Obtain an official Windows 11 x64 ISO or use another trusted Windows 10/11
   install ISO, or use a trusted Windows WIM.
3. Run `scripts/New-AdHunterLabVm.ps1 -IsoPath <path-to-iso>` when you have an
   ISO, or run `scripts/New-AdHunterLabVmFromWim.ps1 -WimPath <path-to-wim>`
   when you only have a WIM image.
4. Install Windows in the VM if you used an ISO. A WIM-based build lands a
   pre-applied OS directly into the VHDX.
5. Inside the VM, copy this workspace or the scripts under
   `C:\Analysis\adhunter\scripts`.
6. Inside the VM, run `scripts/Install-GuestAnalysisTools.ps1`.
7. Create a checkpoint named `clean-os`.
8. Inside the VM, run `scripts/Capture-GuestBaseline.ps1 -Label clean-os`.
9. Download the AdHunter client inside the VM with
    `scripts/Get-AdHunterClient.ps1`.
10. Run `scripts/Get-AdHunterStaticProfile.ps1 -SamplePath <client-file>`.
11. Create a checkpoint named `pre-client-download`.
12. Capture a baseline before first execution with
    `scripts/Capture-GuestBaseline.ps1 -Label before-first-run`.
13. Execute the client manually inside the VM while Procmon, Process Explorer,
    TCPView, and Wireshark are running.
14. Capture another snapshot with
    `scripts/Capture-GuestBaseline.ps1 -Label after-first-run`.

## Notes

- Default VM name: `AdHunterLab`
- Default VM storage root: `C:\HyperV\AdHunterLab`
- Default guest analysis root: `C:\Analysis\adhunter`
- The client download automation defaults to the AdHunter "common" build
  (`type=0`).
