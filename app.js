(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const opcodes = { LDA: 0x0, ADD: 0x1, SUB: 0x2, OUT: 0xE, HLT: 0xF };
  const namesByOpcode = { 0: 'LDA', 1: 'ADD', 2: 'SUB', 14: 'OUT', 15: 'HLT' };
  const defaultProgram = 'LDA 9\nADD A\nSUB B\nOUT\nHLT';
  let ram = Array(16).fill(0), registers, loaded = false, running = false, halted = false, timer = null, steps = 0;
  const blankRegisters = () => ({ PC: 0, MAR: 0, IR: 0, A: 0, B: 0, OUT: 0 });
  const hex = (n, digits = 2) => (n & (digits === 1 ? 0xF : 0xFF)).toString(16).toUpperCase().padStart(digits, '0');
  const binary = (n, bits) => (n & (bits === 4 ? 0xF : 0xFF)).toString(2).padStart(bits, '0');

  function setStatus(text, state = '') {
    $('statusText').textContent = text;
    $('statusDot').parentElement.className = `status-pill ${state}`;
  }
  function message(text, error = false) {
    $('message').textContent = text;
    $('message').classList.toggle('error', error);
  }
  function renderRegisters() {
    ['PC', 'MAR', 'IR', 'A', 'B', 'OUT'].forEach((key) => {
      $( `value-${key}` ).textContent = hex(registers[key], key === 'PC' || key === 'MAR' ? 1 : 2);
      $( `bits-${key}` ).textContent = key === 'PC' || key === 'MAR' ? binary(registers[key], 4) : `${binary(registers[key] >> 4, 4)} ${binary(registers[key] & 15, 4)}`;
    });
    $('outputHex').textContent = `${hex(registers.OUT)}H`;
    [...$('ledRow').children].forEach((led, bit) => led.classList.toggle('on', Boolean(registers.OUT & (1 << (7 - bit)))));
    $('outputCaption').textContent = registers.hasOutput ? `Output captured: ${binary(registers.OUT >> 4, 4)} ${binary(registers.OUT & 15, 4)}` : 'No output yet. Run an OUT instruction.';
  }
  function renderRam(current = -1) {
    $('ramGrid').innerHTML = ram.map((value, i) => `<div class="ram-cell ${i === current ? 'current' : ''} ${i < 5 && loaded ? 'instruction' : ''}"><span class="ram-address">${hex(i, 1)}H</span><span class="ram-value">${hex(value)}</span></div>`).join('');
  }
  function log(text) {
    const list = $('activityLog');
    const empty = list.querySelector('.empty-log');
    if (empty) empty.remove();
    const item = document.createElement('li');
    item.textContent = text;
    list.prepend(item);
    $('stepCount').textContent = `${steps} ${steps === 1 ? 'step' : 'steps'}`;
  }
  function pulseBus(value) {
    $('busValue').textContent = hex(value);
    const line = $('busPulse');
    line.parentElement.classList.remove('active');
    void line.parentElement.offsetWidth;
    line.parentElement.classList.add('active');
  }
  function parseProgram() {
    const lines = $('programInput').value.split(/\r?\n/).map((raw) => raw.split(';')[0].trim()).filter(Boolean);
    if (!lines.length) throw new Error('Enter at least one instruction.');
    if (lines.length > 16) throw new Error('The program cannot exceed 16 memory addresses.');
    const program = [];
    lines.forEach((line, i) => {
      const parts = line.replace(/,/g, ' ').trim().split(/\s+/);
      const op = parts[0].toUpperCase();
      if (!(op in opcodes)) throw new Error(`Line ${i + 1}: unknown instruction “${parts[0]}”.`);
      const needsAddress = ['LDA', 'ADD', 'SUB'].includes(op);
      if (needsAddress && parts.length !== 2) throw new Error(`Line ${i + 1}: ${op} needs a memory address.`);
      if (!needsAddress && parts.length !== 1) throw new Error(`Line ${i + 1}: ${op} does not take an address.`);
      let operand = 0;
      if (needsAddress) {
        const token = parts[1].replace(/h$/i, '');
        if (!/^[0-9a-f]$/i.test(token)) throw new Error(`Line ${i + 1}: use a single hexadecimal address from 0 to F.`);
        operand = parseInt(token, 16);
      }
      program.push((opcodes[op] << 4) | operand);
    });
    if (!program.some((byte) => (byte >> 4) === opcodes.HLT)) throw new Error('Add HLT so the machine knows when to stop.');
    const data = { 9: readByte('data9'), 10: readByte('dataA'), 11: readByte('dataB') };
    Object.keys(data).forEach((addr) => {
      if (Number(addr) < program.length) throw new Error(`The program uses address ${hex(Number(addr), 1)}H, which conflicts with the data values. Use fewer instructions or move data addresses in the code.`);
    });
    return { program, data };
  }
  function readByte(id) {
    const value = $(id).value.trim();
    if (!/^[0-9a-f]{1,2}$/i.test(value)) throw new Error(`${$(id).parentElement.firstElementChild.textContent}: enter a hex value from 00 to FF.`);
    return parseInt(value, 16);
  }
  function loadProgram() {
    stopRun();
    try {
      const parsed = parseProgram();
      ram = Array(16).fill(0);
      parsed.program.forEach((byte, i) => ram[i] = byte);
      Object.entries(parsed.data).forEach(([address, value]) => ram[Number(address)] = value);
      registers = blankRegisters(); registers.hasOutput = false;
      loaded = true; halted = false; steps = 0;
      $('activityLog').innerHTML = '<li class="empty-log">Your execution steps will appear here.</li>';
      $('stepCount').textContent = '0 steps';
      $('stepButton').disabled = false; $('runButton').disabled = false;
      renderRegisters(); renderRam();
      setStatus('Loaded');
      message(`Loaded ${parsed.program.length} instructions and data at 9H, AH, and BH.`);
    } catch (error) { message(error.message, true); }
  }
  function step(fromRun = false) {
    if (!loaded || halted || (running && !fromRun)) return;
    const address = registers.PC;
    registers.MAR = address;
    pulseBus(address);
    const instruction = ram[registers.MAR];
    registers.IR = instruction;
    registers.PC = (registers.PC + 1) & 15;
    const opcode = instruction >> 4, operand = instruction & 15;
    const op = namesByOpcode[opcode];
    steps++;
    if (!op) {
      halted = true; setStatus('Invalid instruction', 'halted');
      message(`Unknown opcode ${hex(opcode, 1)}H at ${hex(address, 1)}H.`, true);
      log(`Fault · unknown opcode ${hex(opcode, 1)}H at address ${hex(address, 1)}H.`);
      renderRegisters(); renderRam(address); return;
    }
    $('aluOperation').textContent = op === 'ADD' ? 'A + B' : op === 'SUB' ? 'A − B' : op === 'HLT' ? 'HALTED' : op;
    let description = `${hex(address, 1)}H · ${op}`;
    if (op === 'LDA' || op === 'ADD' || op === 'SUB') {
      registers.MAR = operand;
      const value = ram[operand]; pulseBus(value);
      if (op === 'LDA') { registers.A = value; description += ` ${hex(operand, 1)}H · A ← RAM[${hex(operand, 1)}H] (${hex(value)})`; }
      if (op === 'ADD') { registers.B = value; registers.A = (registers.A + registers.B) & 255; description += ` ${hex(operand, 1)}H · A ← A + RAM = ${hex(registers.A)}`; }
      if (op === 'SUB') { registers.B = value; registers.A = (registers.A - registers.B) & 255; description += ` ${hex(operand, 1)}H · A ← A − RAM = ${hex(registers.A)}`; }
    } else if (op === 'OUT') {
      registers.OUT = registers.A; registers.hasOutput = true; pulseBus(registers.A); description += ` · output ${hex(registers.OUT)}H`;
    } else if (op === 'HLT') {
      halted = true; setStatus('Halted', 'halted'); message('Program halted. Reset to run it again.'); description += ' · execution stopped';
    }
    if (!halted) { setStatus(running ? 'Running' : 'Stepping', running ? 'running' : ''); message(`Executed ${op} at ${hex(address, 1)}H.`); }
    log(description); renderRegisters(); renderRam(op === 'LDA' || op === 'ADD' || op === 'SUB' ? operand : address);
  }
  function stopRun() {
    if (timer) clearTimeout(timer);
    timer = null; running = false;
    if ($('runButton')) $('runButton').innerHTML = 'Run <span>▶</span>';
  }
  function run() {
    if (!loaded || halted) return;
    if (running) { stopRun(); setStatus('Paused'); message('Run paused. Select Run to continue.'); return; }
    running = true; $('runButton').innerHTML = 'Pause <span>Ⅱ</span>';
    const tick = () => {
      if (!running || halted) { stopRun(); return; }
      step(true);
      if (running && !halted) timer = setTimeout(tick, Number($('speedInput').value));
      else stopRun();
    };
    setStatus('Running', 'running'); message('Program is running…'); tick();
  }
  function reset() {
    stopRun();
    if (!registers) registers = blankRegisters();
    else { registers = blankRegisters(); registers.hasOutput = false; }
    halted = false; steps = 0; $('aluOperation').textContent = 'IDLE';
    $('stepCount').textContent = '0 steps';
    $('activityLog').innerHTML = '<li class="empty-log">Your execution steps will appear here.</li>';
    $('stepButton').disabled = !loaded; $('runButton').disabled = !loaded;
    renderRegisters(); renderRam(); setStatus(loaded ? 'Reset' : 'Ready');
    message(loaded ? 'Registers cleared. The loaded program is ready to run.' : 'Enter a program, then load it into memory.');
  }
  function init() {
    $('programInput').value = defaultProgram;
    registers = blankRegisters(); registers.hasOutput = false;
    $('ramGrid').innerHTML = Array.from({ length: 16 }, (_, i) => `<div class="ram-cell"><span class="ram-address">${hex(i, 1)}H</span><span class="ram-value">00</span></div>`).join('');
    $('ledRow').innerHTML = Array.from({ length: 8 }, () => '<span class="led"></span>').join('');
    renderRegisters();
    $('loadButton').addEventListener('click', loadProgram);
    $('stepButton').addEventListener('click', step);
    $('runButton').addEventListener('click', run);
    $('resetButton').addEventListener('click', reset);
    $('speedInput').addEventListener('input', () => $('speedLabel').textContent = `${(Number($('speedInput').value) / 1000).toFixed(2).replace(/^0/, '')}s`);
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) { stopRun(); setStatus('Paused'); message('Run paused while the page is hidden.'); } });
  }
  init();
})();
