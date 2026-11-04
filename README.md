# Sap-1-Simulator-Group-2

A small, browser-based SAP-1 teaching simulator built with plain HTML, CSS, and JavaScript. It shows the core registers, 16 × 8-bit RAM, a W-Bus activity indicator, the ALU operation, execution log, and an 8-bit LED output.

## Run the simulator

1. Download or clone this folder.
2. Download live server extension in vscode.
3. Right click `index.html` and open with live server.
4. Edit the assembly instructions or the hexadecimal values at addresses `9H`, `AH`, and `BH`.
5. Select **Load program**, then use **Step** or **Run**.

No packages or build tools are required. An internet connection is only needed to load the optional Google Fonts; the simulator itself runs locally.

## Language and framework

This project uses HTML, CSS, and vanilla JavaScript without a framework. That keeps the simulator easy to run and makes the SAP-1 register and instruction logic visible to students who are learning architecture and web development.

## Instruction format

Enter one instruction on each line. Addresses are one hexadecimal digit from `0` to `F`.

| Instruction | Opcode | Meaning |
| --- | --- | --- |
| `LDA address` | `0` | Load the accumulator from RAM |
| `ADD address` | `1` | Add a RAM value to the accumulator |
| `SUB address` | `2` | Subtract a RAM value from the accumulator |
| `OUT` | `E` | Copy the accumulator to the output register |
| `HLT` | `F` | Stop execution |

Lines may include comments after a semicolon. Programs must include `HLT`. The default program computes `25H + 05H − 23H`, producing `07H`. Change the three data fields and load again to try other values.

## Upload to GitHub with VS Code

1. Open this folder in VS Code.
2. Select **Source Control** and choose **Initialize Repository**.
3. Stage the files with **+**, enter a commit message, and select **Commit**.
4. Press **Ctrl+Shift+P**, run **Git: Add Remote**, paste your GitHub repository link, and name the remote `origin`.
5. Press **Ctrl+Shift+P** and run **Git: Push** or **Publish Branch**.

## Current scope

The simulator executes one complete instruction per **Step**. Register and RAM values display in hexadecimal, with binary shown beneath the registers. The memory panel highlights the current instruction or operand address. Arithmetic wraps to 8 bits, matching the register width.
