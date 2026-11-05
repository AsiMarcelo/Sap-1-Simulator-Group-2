# Sap-1-Simulator-Group-2

A compact online SAP-1 educational simulator created using standard HTML, CSS, and JavaScript. It displays the main registers, 16 × 8-bit RAM, a W-Bus activity monitor, the ALU function, execution history, and an 8-bit LED output.

## Run the simulator

1. Download or clone this folder.
2. Download live server extension in vscode.
3. Right click `index.html` and open with live server.
4. Edit the assembly instructions and enter the hexadecimal data values. The data addresses update automatically from `LDA`, `ADD`, and `SUB` operands.
5. Select **Load program**, then use **Step** or **Run**.

No packages or build tools are required. An internet connection is only needed to load the optional Google Fonts; the simulator itself runs locally.

## Language and framework

This initiative employs HTML, CSS, and plain JavaScript without utilizing a framework. This ensures the simulator is simple to operate and allows students studying architecture and web development to see the SAP-1 register and instruction logic.

## Instruction format

Enter one instruction on each line. Addresses are one hexadecimal digit from `0` to `F`.

| Instruction | Opcode | Meaning |
| --- | --- | --- |
| `LDA address` | `0` | Load the accumulator from RAM |
| `ADD address` | `1` | Add a RAM value to the accumulator |
| `SUB address` | `2` | Subtract a RAM value from the accumulator |
| `OUT` | `E` | Copy the accumulator to the output register |
| `HLT` | `F` | Stop execution |

Programs need to have `HLT` included. The standard program calculates `25H + 05H − 23H`, yielding `07H`. Modify the three data fields and reload to test different values.
## Upload to GitHub with VS Code

1. Open this folder in VS Code.
2. Select **Source Control** and choose **Initialize Repository**.
3. Stage the files with **+**, enter a commit message, and select **Commit**.
4. Press **Ctrl+Shift+P**, run **Git: Add Remote**, paste your GitHub repository link, and name the remote `origin`.
5. Press **Ctrl+Shift+P** and run **Git: Push** or **Publish Branch**.

## Current scope

The simulator performs a full instruction with each **Step**. Register and RAM values are presented in hexadecimal, while binary is displayed underneath the registers. The memory panel emphasizes the address of the current instruction or operand. Arithmetic cycles through 8 bits, aligning with the register size.

