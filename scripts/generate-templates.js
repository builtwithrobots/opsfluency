/**
 * Generates the 4 visible SOP starter template DOCX files.
 * Run with: node scripts/generate-templates.js
 * Output:   public/templates/*.docx
 *
 * Format mirrors public/examples/example-sop.docx:
 *   - Document metadata table (Doc#, Dept, Revision, Effective Date, Approved By, Review Cycle)
 *   - Single-cell purpose callout box
 *   - Numbered bold H1 sections, H2 subsections
 *   - WARNING / DANGER single-cell callout tables
 *   - Data tables with bold header rows
 *   - Sign-off acknowledgment table
 */
/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const path = require("path");
const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} = require("docx");

const OUT_DIR = path.join(__dirname, "..", "public", "templates");

// ─── primitive helpers ────────────────────────────────────────────────────────

const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };

function p(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    ...(opts.alignment ? { alignment: opts.alignment } : {}),
    ...(opts.heading ? { heading: opts.heading } : {}),
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, size: opts.size ?? 24, bold: opts.bold, italics: opts.italic, color: opts.color });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
  });
}

function body(runs, after = 120) {
  const items = Array.isArray(runs) ? runs : [typeof runs === "string" ? run(runs) : runs];
  return new Paragraph({ children: items, spacing: { after } });
}

function bullet(text) {
  const parts = Array.isArray(text) ? text : [run(text)];
  return new Paragraph({
    children: parts,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function numbered(num, text) {
  const parts = Array.isArray(text) ? text : [run(text)];
  return new Paragraph({
    children: [run(`${num}.  `, { bold: true }), ...parts],
    spacing: { after: 100 },
    indent: { left: 360 },
  });
}

function spacer() {
  return new Paragraph({ text: "", spacing: { after: 80 } });
}

// ─── table builders ───────────────────────────────────────────────────────────

function metaTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER_THIN, bottom: BORDER_THIN,
      left: BORDER_THIN, right: BORDER_THIN,
      insideH: BORDER_THIN, insideV: BORDER_THIN,
    },
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(label, { bold: true })] })],
            shading: { type: ShadingType.SOLID, fill: "F3F4F6" },
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(value)] })],
          }),
        ],
      })
    ),
  });
}

function callout(paragraphs, fill = "F3F4F6") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER_THIN, bottom: BORDER_THIN,
      left: BORDER_THIN, right: BORDER_THIN,
      insideH: BORDER_NONE, insideV: BORDER_NONE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: paragraphs,
            shading: { type: ShadingType.SOLID, fill },
          }),
        ],
      }),
    ],
  });
}

function warning(label, text) {
  return callout([
    new Paragraph({
      children: [run(`${label}: `, { bold: true }), run(text)],
      spacing: { after: 0 },
    }),
  ], "FFF3CD");
}

function danger(text) {
  return callout([
    new Paragraph({
      children: [run("DANGER: ", { bold: true }), run(text)],
      spacing: { after: 0 },
    }),
  ], "FFE5E5");
}

function dataTable(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map((h) =>
      new TableCell({
        children: [new Paragraph({ children: [run(h, { bold: true })] })],
        shading: { type: ShadingType.SOLID, fill: "F3F4F6" },
      })
    ),
    tableHeader: true,
  });
  const dataRows = rows.map((row) =>
    new TableRow({
      children: row.map((cell) =>
        new TableCell({
          children: [new Paragraph({ children: [run(cell)] })],
        })
      ),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER_THIN, bottom: BORDER_THIN,
      left: BORDER_THIN, right: BORDER_THIN,
      insideH: BORDER_THIN, insideV: BORDER_THIN,
    },
    rows: [headerRow, ...dataRows],
  });
}

function signoffTable(fields) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER_THIN, bottom: BORDER_THIN,
      left: BORDER_THIN, right: BORDER_THIN,
      insideH: BORDER_THIN, insideV: BORDER_THIN,
    },
    rows: fields.map((label) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(label, { bold: true })] })],
            shading: { type: ShadingType.SOLID, fill: "F3F4F6" },
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: "" })],
          }),
        ],
      })
    ),
  });
}

function docHeader(category, title, subtitle, docNum, dept, revision, effectiveDate) {
  return [
    p(run(category, { italic: true, size: 20, color: "666666" }), { alignment: AlignmentType.CENTER }),
    p(run(title, { bold: true, size: 32 }), { alignment: AlignmentType.CENTER }),
    p(run(subtitle, { italic: true, size: 22, color: "444444" }), { alignment: AlignmentType.CENTER }),
    spacer(),
    metaTable([
      ["Document Number", docNum],
      ["Department", dept],
      ["Revision", revision],
      ["Effective Date", effectiveDate],
      ["Approved By", "[NAME, TITLE]"],
      ["Review Cycle", "Annual"],
    ]),
    spacer(),
  ];
}

function footer() {
  return [
    spacer(),
    new Paragraph({
      children: [run("OpsFluency SOP Template — download, edit, then upload at your OpsFluency dashboard.", { size: 18, color: "999999", italic: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 0 },
    }),
  ];
}

// ─── template 1: Machine Startup & Shutdown ──────────────────────────────────

async function makeMachineStartup() {
  const doc = new Document({
    sections: [{
      children: [
        ...docHeader(
          "OPSFLUENCY SOP TEMPLATE",
          "MACHINE STARTUP & SHUTDOWN PROCEDURE",
          "Operational SOP — Equipment Safety & Operation",
          "OPS-001", "[DEPARTMENT NAME]", "Rev. 1", "[DATE]"
        ),

        callout([
          body([run("PURPOSE: ", { bold: true }), run("This procedure defines the required steps for safely starting up and shutting down [EQUIPMENT NAME / MODEL] located in the [DEPARTMENT / AREA NAME]. Following this procedure protects workers from injury, prevents equipment damage, and ensures proper handoff between shifts. All operators must be trained and authorized before performing this procedure.")], 0),
        ]),
        spacer(),

        h1("1. REQUIRED PERSONNEL AND PPE"),
        body([run("Authorized to perform this procedure: ", { bold: true }), run("[JOB TITLE — e.g., Machine Operator, Production Lead, Maintenance Technician]")]),
        body("Required PPE before beginning startup or shutdown:"),
        bullet("Safety glasses or face shield"),
        bullet("Steel-toed, slip-resistant boots"),
        bullet("Hearing protection (if equipment noise exceeds 85 dB)"),
        bullet("[ADD ANY ADDITIONAL PPE REQUIRED FOR THIS EQUIPMENT]"),
        spacer(),

        h1("2. PRE-STARTUP SAFETY CHECKS"),
        body("Complete all checks before energizing the equipment. Do not proceed to startup if any item fails."),
        spacer(),
        numbered(1, "Confirm the area within 10 feet of the equipment is clear of personnel, unauthorized materials, and obstructions."),
        numbered(2, "Inspect the exterior of the machine for visible damage, fluid leaks, or loose fasteners. If found, tag out of service and notify your supervisor."),
        numbered(3, "Verify all machine guards, shields, and safety interlocks are in place and undamaged."),
        numbered(4, "[SITE-SPECIFIC CHECK — e.g., Confirm hydraulic fluid level is within the MIN/MAX range on the sight glass.]"),
        numbered(5, "Check that the Emergency Stop button is accessible and not obstructed."),
        numbered(6, "Confirm the lockout/tagout station is clear — no active LOTO tags should be on this machine before startup."),
        spacer(),
        danger("If any guard, interlock, or safety device is missing, damaged, or non-functional, do NOT start the equipment. Apply a DANGER tag at the control panel and contact your supervisor immediately."),
        spacer(),

        h1("3. STARTUP PROCEDURE"),
        body("Perform steps in order. Do not skip or combine steps."),
        spacer(),
        numbered(1, "[STEP — e.g., Turn the main power disconnect switch to ON. The control panel will illuminate.]"),
        numbered(2, "[STEP — e.g., Wait for the HMI / control panel to complete its self-test sequence (approximately 30 seconds).]"),
        numbered(3, "[STEP — e.g., Confirm all status indicators are green before proceeding. Address any fault codes per the fault reference sheet.]"),
        numbered(4, "[STEP — e.g., Set operating mode to RUN and confirm speed/pressure settings match the current production order.]"),
        numbered(5, "[STEP — e.g., Start the auxiliary systems first (cooling, lubrication) and allow 2 minutes to reach operating temperature.]"),
        numbered(6, "[STEP — e.g., Initiate the main drive and confirm normal startup sounds — no unusual vibration, grinding, or alarms.]"),
        numbered(7, "Record startup time and any observations in the equipment logbook at [LOCATION / SYSTEM NAME]."),
        spacer(),

        h1("4. NORMAL OPERATION"),
        body("Monitor the following during operation:"),
        bullet("[PARAMETER — e.g., Operating temperature: should remain between 180°F and 220°F. Alert supervisor if outside this range.]"),
        bullet("[PARAMETER — e.g., Cycle time: nominal is [X] seconds per unit. Sustained deviation of >10% requires investigation.]"),
        bullet("[PARAMETER — e.g., Vibration and noise: any change from baseline operating sound is a stop-and-inspect condition.]"),
        bullet("Do not leave the machine unattended during the first 15 minutes of a new production run."),
        bullet("[ADD ANY ADDITIONAL MONITORING REQUIREMENT FOR THIS EQUIPMENT]"),
        spacer(),

        h1("5. PLANNED SHUTDOWN"),
        numbered(1, "[STEP — e.g., Complete the current production cycle or reach a safe stopping point in the process.]"),
        numbered(2, "[STEP — e.g., Set the operating mode to IDLE and allow the machine to decelerate to a stop naturally — do not use the E-Stop for routine shutdown.]"),
        numbered(3, "[STEP — e.g., Shut down auxiliary systems (lubrication, cooling) in reverse startup order.]"),
        numbered(4, "[STEP — e.g., Turn the main power disconnect switch to OFF.]"),
        numbered(5, "If the machine will be unattended overnight or during a weekend: apply lockout/tagout per [LOTO PROCEDURE REFERENCE NUMBER]."),
        numbered(6, "Record shutdown time, production count, and any anomalies in the equipment logbook."),
        spacer(),

        h1("6. EMERGENCY SHUTDOWN"),
        danger("If at any time an unsafe condition arises — including injury, fire, smoke, unusual sounds, uncontrolled movement, or any condition the operator cannot identify — press the red EMERGENCY STOP button and immediately notify your supervisor and do not restart until cleared by [AUTHORIZED PERSON / TITLE]."),
        spacer(),
        body("Emergency Stop button location: [DESCRIBE LOCATION ON MACHINE — e.g., Red mushroom button, front panel, left side]"),
        body("After E-Stop activation, the machine must not be restarted until:"),
        bullet("The cause of the shutdown has been identified and documented."),
        bullet("Any affected equipment, tooling, or materials have been inspected."),
        bullet("[AUTHORIZED PERSON / TITLE] has cleared the machine for restart in writing."),
        spacer(),

        h1("7. DOCUMENTATION AND SIGN-OFF"),
        body("Both the operator and shift supervisor must sign this record at the end of each shift."),
        spacer(),
        signoffTable([
          "Equipment Name / ID",
          "Operator Name (print)",
          "Operator Signature",
          "Shift Date",
          "Shift (Circle One):  Day  /  Swing  /  Night",
          "Any issues observed this shift?",
          "Supervisor Name (print)",
          "Supervisor Signature",
        ]),

        ...footer(),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── template 2: Forklift Pre-Shift Inspection ───────────────────────────────

async function makeForkliftInspection() {
  const doc = new Document({
    sections: [{
      children: [
        ...docHeader(
          "OPSFLUENCY SOP TEMPLATE",
          "FORKLIFT PRE-SHIFT INSPECTION",
          "Safety SOP — Powered Industrial Equipment",
          "SAF-001", "[DEPARTMENT NAME]", "Rev. 1", "[DATE]"
        ),

        callout([
          body([run("PURPOSE: ", { bold: true }), run("Every forklift operator must complete this inspection before operating any forklift unit. A forklift that fails any item on this inspection must be taken out of service immediately. Do not operate a tagged-out forklift under any circumstances, including moving it short distances.")], 0),
        ]),
        spacer(),

        h1("1. BEFORE YOU BEGIN"),
        body("Gather the following before starting the inspection:"),
        bullet("This inspection form (or the digital version in [SYSTEM / APP NAME])"),
        bullet("Your operator certification card — you must be a certified operator to complete this inspection"),
        bullet("A functional flashlight if inspecting in low-light areas"),
        spacer(),
        body("Park the forklift on a level surface with forks fully lowered and tilt back to neutral. Set the parking brake. Turn the ignition OFF before the physical inspection begins."),
        spacer(),

        h1("2. VISUAL INSPECTION"),
        body("Walk around the unit and check each item. Mark Pass (P), Fail (F), or Not Applicable (N/A). Any Fail must be explained in the Notes section below."),
        spacer(),
        dataTable(
          ["Item", "Check", "P / F / N/A", "Notes"],
          [
            ["Tires / Wheels", "No cuts, chunking, or flat spots; lug nuts present and tight", "", ""],
            ["Forks", "No cracks, bends, or welds; tine height is even (within ¼ inch)", "", ""],
            ["Carriage & Mast", "Rails straight; chains not kinked or stretched; no visible cracks", "", ""],
            ["Overhead Guard", "Intact, secure, no bent or missing bars", "", ""],
            ["Backrest Extension", "Present and properly seated if required for load type", "", ""],
            ["Battery / Fuel", "Charge ≥ 20% (electric) or fuel level adequate; no leaks visible", "", ""],
            ["Hydraulic Lines", "No visible leaks; hoses not frayed or rubbing on metal", "", ""],
            ["Engine / Motor Area", "No fluid puddles under unit; no unusual odors", "", ""],
            ["Nameplate & Warnings", "Legible; capacity plate matches the unit", "", ""],
            ["Seatbelt / Restraint", "Present, latches and releases cleanly, webbing not frayed", "", ""],
            ["Lights (if equipped)", "Head, tail, and strobe lights all functional", "", ""],
            ["Horn", "Audible at 10 feet", "", ""],
          ]
        ),
        spacer(),

        h1("3. OPERATIONAL CHECK (engine running)"),
        body("Start the unit and perform the following checks with the engine or motor running. Keep forks low and remain in a clear, open area."),
        spacer(),
        numbered(1, "Steering: Turn the wheel lock-to-lock in both directions. Confirm smooth, responsive steering with no binding."),
        numbered(2, "Service brakes: Drive slowly and apply brakes firmly. Confirm the unit stops squarely with no pull to one side."),
        numbered(3, "Parking brake: Apply the parking brake and confirm the unit does not roll on a level surface."),
        numbered(4, "Lift and lower: Raise forks to maximum height and lower to floor. Confirm smooth movement with no hesitation or jerking."),
        numbered(5, "Tilt: Tilt mast forward and back through full range. Confirm smooth, controlled movement."),
        numbered(6, "Horn: Press the horn and confirm it sounds clearly."),
        numbered(7, "[SITE-SPECIFIC CHECK — e.g., Side shift function: confirm even left/right movement with no binding.]"),
        spacer(),
        danger("Do not operate the forklift if brakes feel spongy, if steering is unresponsive, or if any hydraulic function is sluggish or inoperative. Tag the unit and notify your supervisor."),
        spacer(),

        h1("4. OUT-OF-SERVICE PROTOCOL"),
        body("If the unit fails any item in Section 2 or Section 3:"),
        numbered(1, "Park the unit in a safe, out-of-traffic location."),
        numbered(2, "Apply an OUT OF SERVICE tag to the key or steering wheel — do not leave the tag in your pocket."),
        numbered(3, "Tag location: [DESCRIBE WHERE TAGS ARE STORED — e.g., Safety board near the Equipment Room entrance]."),
        numbered(4, "Notify your supervisor immediately. Do not move or operate the unit until it has been inspected and cleared by [AUTHORIZED PERSON / TITLE]."),
        numbered(5, "Record the deficiency in the equipment defect log at [LOCATION / SYSTEM NAME]."),
        spacer(),
        warning("WARNING", "Operating a forklift that has been tagged OUT OF SERVICE is a serious safety violation and may result in disciplinary action up to and including termination."),
        spacer(),

        h1("5. INSPECTION LOG AND SIGN-OFF"),
        body("Complete after every inspection. Both operator and supervisor signatures are required before the first loaded operation of the shift."),
        spacer(),
        signoffTable([
          "Forklift Unit ID",
          "Inspection Date",
          "Shift Start Time",
          "Operator Name (print)",
          "Operator Signature",
          "Overall Result:  PASS  /  FAIL  (circle one)",
          "If FAIL — deficiency description",
          "Supervisor Name (print)",
          "Supervisor Signature",
        ]),

        ...footer(),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── template 3: Emergency Contacts & Procedures ─────────────────────────────

async function makeEmergencyContacts() {
  const doc = new Document({
    sections: [{
      children: [
        ...docHeader(
          "OPSFLUENCY SOP TEMPLATE",
          "EMERGENCY CONTACTS & PROCEDURES",
          "Reference Document — Safety & Emergency Response",
          "SAF-002", "[FACILITY / DEPARTMENT NAME]", "Rev. 1", "[DATE]"
        ),

        callout([
          body([run("PURPOSE: ", { bold: true }), run("This document provides emergency contact numbers, internal contacts by role, evacuation procedures, and post-incident requirements for [FACILITY NAME]. Print and post a copy at every workstation and in the break room. Review annually or whenever contact information changes.")], 0),
        ]),
        spacer(),

        h1("1. EMERGENCY PHONE NUMBERS"),
        body("Call 911 first for any life-threatening emergency. Use the numbers below for facility-specific escalation."),
        spacer(),
        dataTable(
          ["Emergency", "Number", "When to Call"],
          [
            ["Police / Fire / EMS (911)", "911", "Any life-threatening emergency — fire, injury, medical, active threat"],
            ["Facility Security Desk", "[NUMBER]", "Unauthorized entry, suspicious activity, theft, after-hours access issues"],
            ["Facility Manager (on-call)", "[NAME] — [NUMBER]", "Any major incident requiring management notification after hours"],
            ["Maintenance Emergency Line", "[NUMBER]", "Equipment failure, gas leak, structural concern, utility outage"],
            ["Poison Control", "1-800-222-1222", "Chemical exposure, ingestion, or spill involving hazardous materials"],
            ["[ADD SITE-SPECIFIC CONTACT]", "[NUMBER]", "[SITUATION]"],
          ]
        ),
        spacer(),

        h1("2. INTERNAL CONTACTS BY ROLE"),
        dataTable(
          ["Role", "Name", "Phone / Extension / Radio Channel"],
          [
            ["Safety Officer / EHS Manager", "[NAME]", "[CONTACT]"],
            ["HR Manager", "[NAME]", "[CONTACT]"],
            ["Maintenance Lead", "[NAME]", "[CONTACT]"],
            ["Operations Manager", "[NAME]", "[CONTACT]"],
            ["First Aid Responder (certified)", "[NAME]", "[CONTACT]"],
            ["[ADD ROLE]", "[NAME]", "[CONTACT]"],
          ]
        ),
        spacer(),

        h1("3. EVACUATION PROCEDURE"),
        body("Follow these steps whenever the fire alarm sounds, a PA announcement directs evacuation, or a supervisor gives the verbal order to evacuate."),
        spacer(),
        numbered(1, "Stop work immediately. Do not attempt to save work in progress, retrieve personal belongings, or shut down equipment — these actions have caused deaths."),
        numbered(2, "Warn any coworkers in your immediate area who may not have heard the alarm."),
        numbered(3, "Exit through the nearest marked emergency exit — refer to the floor plan posted at your workstation."),
        numbered(4, "Close (but do not lock) any fire doors you pass through to slow the spread of smoke."),
        numbered(5, "Proceed directly to your assembly point (see Section 4). Do not stop in the parking lot — move to the designated area."),
        numbered(6, "Report to your supervisor or the designated assembly monitor. Remain at the assembly point until a headcount is completed and an all-clear is given."),
        numbered(7, "Do not re-enter the building for any reason until [AUTHORITY — e.g., Fire Department Incident Commander or Facility Manager] gives the all-clear."),
        spacer(),
        danger("Do NOT use elevators during an evacuation. Do NOT re-enter the building to retrieve personal items, equipment, or vehicles. Personnel accountability at the assembly point takes priority over everything else."),
        spacer(),

        h1("4. ASSEMBLY POINTS"),
        body("Assembly points are assigned by work zone. Report to your zone's assembly point immediately upon evacuation."),
        spacer(),
        dataTable(
          ["Work Zone / Area", "Primary Assembly Point", "Secondary Assembly Point (if primary blocked)"],
          [
            ["[ZONE A — e.g., Warehouse Floor, Bays 1–6]", "[LOCATION — e.g., East Parking Lot, Row C]", "[ALTERNATE LOCATION]"],
            ["[ZONE B — e.g., Receiving / Shipping Dock]", "[LOCATION]", "[ALTERNATE LOCATION]"],
            ["[ZONE C — e.g., Office / Administration]", "[LOCATION]", "[ALTERNATE LOCATION]"],
            ["[ADD ZONE]", "[LOCATION]", "[ALTERNATE LOCATION]"],
          ]
        ),
        spacer(),
        body("Assembly point monitors (responsible for headcount):"),
        bullet("[ZONE A] — [NAME / TITLE]"),
        bullet("[ZONE B] — [NAME / TITLE]"),
        bullet("[ZONE C] — [NAME / TITLE]"),
        spacer(),

        h1("5. POST-INCIDENT REQUIREMENTS"),
        body("After any emergency — including evacuations, injuries, near-misses, chemical spills, or equipment failures:"),
        numbered(1, "Confirm all personnel are accounted for at the assembly point before any re-entry or other action."),
        numbered(2, "Any injury, no matter how minor, must be reported to your supervisor immediately and documented with HR within 24 hours."),
        numbered(3, "Do not move, disturb, or clean up any equipment or materials involved in the incident until the Safety Officer has photographed and documented the scene."),
        numbered(4, "Complete an incident report within [TIMEFRAME — e.g., 24 hours] at [LOCATION / SYSTEM — e.g., the HR portal or the paper incident form in the HR office]."),
        numbered(5, "Cooperate fully with any post-incident investigation. Retaliation against an employee who reports a safety incident in good faith is prohibited and grounds for disciplinary action."),
        spacer(),

        h1("6. ANNUAL REVIEW AND ACKNOWLEDGMENT"),
        body("This document must be reviewed annually and updated whenever contact information changes. All associates must acknowledge receipt."),
        spacer(),
        signoffTable([
          "Associate Name (print)",
          "Associate Signature",
          "Date",
          "Supervisor Name",
          "Supervisor Signature",
        ]),

        ...footer(),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── template 4: Equipment Specifications Reference ──────────────────────────

async function makeEquipmentSpecs() {
  const doc = new Document({
    sections: [{
      children: [
        ...docHeader(
          "OPSFLUENCY SOP TEMPLATE",
          "EQUIPMENT SPECIFICATIONS REFERENCE",
          "Reference Document — Equipment & Maintenance",
          "OPS-002", "[DEPARTMENT NAME]", "Rev. 1", "[DATE]"
        ),

        callout([
          body([run("PURPOSE: ", { bold: true }), run("This document provides current specifications, operating parameters, and preventive maintenance schedules for all equipment in the [DEPARTMENT / AREA NAME]. Keep this document current: update it whenever equipment is added, removed, modified, or when operating parameters are adjusted by engineering or the manufacturer.")], 0),
        ]),
        spacer(),

        h1("1. EQUIPMENT INVENTORY"),
        body("All active equipment in this area. Update the status column when equipment is taken out of service, returned, or replaced."),
        spacer(),
        dataTable(
          ["Equipment Name / Description", "Unit ID / Asset #", "Location (Bay / Area)", "Manufacturer & Model", "Status"],
          [
            ["[EQUIPMENT NAME — e.g., Pallet Stretch Wrapper]", "[UNIT ID]", "[LOCATION]", "[MANUFACTURER / MODEL]", "Active"],
            ["[EQUIPMENT NAME]", "[UNIT ID]", "[LOCATION]", "[MANUFACTURER / MODEL]", "Active"],
            ["[EQUIPMENT NAME]", "[UNIT ID]", "[LOCATION]", "[MANUFACTURER / MODEL]", "[STATUS]"],
            ["[EQUIPMENT NAME]", "[UNIT ID]", "[LOCATION]", "[MANUFACTURER / MODEL]", "[STATUS]"],
          ]
        ),
        spacer(),

        h1("2. OPERATING PARAMETERS"),
        body("These are the approved operating limits for each piece of equipment. Operating outside these parameters requires written authorization from [ENGINEERING / MAINTENANCE MANAGER]."),
        spacer(),
        dataTable(
          ["Equipment", "Parameter", "Normal Operating Range", "Do Not Exceed", "Action if Exceeded"],
          [
            ["[EQUIPMENT]", "[e.g., Operating Temperature]", "[e.g., 70°F – 95°F]", "[e.g., 110°F]", "[e.g., Shut down; notify Maintenance]"],
            ["[EQUIPMENT]", "[e.g., Max Load Capacity]", "[e.g., Up to 2,000 lbs]", "[e.g., 2,500 lbs]", "[e.g., Stop loading; notify supervisor]"],
            ["[EQUIPMENT]", "[e.g., Line Speed]", "[e.g., 20–40 units/min]", "[e.g., 50 units/min]", "[e.g., Reduce speed; log deviation]"],
            ["[EQUIPMENT]", "[PARAMETER]", "[RANGE]", "[LIMIT]", "[ACTION]"],
          ]
        ),
        spacer(),

        h1("3. PREVENTIVE MAINTENANCE SCHEDULE"),
        body("Maintenance tasks must be completed on schedule. Log all completed maintenance in [CMMS / LOGBOOK NAME]. Do not defer a safety-critical PM without written supervisor approval."),
        spacer(),
        dataTable(
          ["Equipment", "PM Task", "Frequency", "Est. Time", "Performed By", "Last Completed"],
          [
            ["[EQUIPMENT]", "[e.g., Lubricate drive chain]", "Weekly", "[e.g., 15 min]", "[ROLE — e.g., Operator]", "[DATE]"],
            ["[EQUIPMENT]", "[e.g., Inspect and replace filters]", "Monthly", "[e.g., 30 min]", "[ROLE — e.g., Maintenance Tech]", "[DATE]"],
            ["[EQUIPMENT]", "[e.g., Full mechanical inspection]", "Quarterly", "[e.g., 2 hours]", "[ROLE — e.g., Maintenance Tech]", "[DATE]"],
            ["[EQUIPMENT]", "[e.g., Manufacturer annual service]", "Annual", "[e.g., 4 hours]", "[ROLE — e.g., Vendor / Maintenance]", "[DATE]"],
            ["[EQUIPMENT]", "[PM TASK]", "[FREQUENCY]", "[TIME]", "[ROLE]", "[DATE]"],
          ]
        ),
        spacer(),
        warning("WARNING", "Never perform maintenance on energized equipment. Always apply lockout/tagout per [LOTO PROCEDURE NUMBER] before any maintenance activity, unless the procedure is specifically designated as an energized task."),
        spacer(),

        h1("4. COMMON REPLACEMENT PARTS"),
        body("Stock these parts on-site to minimize downtime. Reorder when inventory falls below the Min Stock level."),
        spacer(),
        dataTable(
          ["Equipment", "Part Name", "Part Number", "Supplier / Vendor", "Min Stock", "Current Stock"],
          [
            ["[EQUIPMENT]", "[PART NAME — e.g., Drive Belt]", "[PART #]", "[SUPPLIER]", "[QTY]", "[QTY]"],
            ["[EQUIPMENT]", "[PART NAME — e.g., Air Filter]", "[PART #]", "[SUPPLIER]", "[QTY]", "[QTY]"],
            ["[EQUIPMENT]", "[PART NAME]", "[PART #]", "[SUPPLIER]", "[QTY]", "[QTY]"],
          ]
        ),
        spacer(),

        h1("5. MAINTENANCE AND VENDOR CONTACTS"),
        dataTable(
          ["Contact Type", "Name / Company", "Phone", "Email / Account #", "Notes"],
          [
            ["Internal Maintenance Lead", "[NAME]", "[PHONE / EXT]", "[EMAIL]", "Primary contact for all equipment issues"],
            ["[EQUIPMENT] Vendor / Service", "[COMPANY NAME]", "[PHONE]", "[EMAIL / ACCOUNT #]", "[SERVICE CONTRACT DETAILS]"],
            ["Parts Supplier", "[COMPANY NAME]", "[PHONE]", "[EMAIL / ACCOUNT #]", "[NOTES]"],
          ]
        ),
        spacer(),

        h1("6. DOCUMENT REVISION LOG"),
        dataTable(
          ["Revision #", "Date", "Description of Change", "Changed By", "Approved By"],
          [
            ["Rev. 1", "[DATE]", "Initial release", "[NAME]", "[NAME]"],
            ["[REV]", "[DATE]", "[DESCRIPTION]", "[NAME]", "[NAME]"],
          ]
        ),

        ...footer(),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const templates = [
    { fn: makeMachineStartup,     file: "sop-startup-shutdown.docx" },
    { fn: makeForkliftInspection, file: "sop-forklift-inspection.docx" },
    { fn: makeEmergencyContacts,  file: "sop-emergency-contacts.docx" },
    { fn: makeEquipmentSpecs,     file: "sop-equipment-specs.docx" },
  ];

  for (const { fn, file } of templates) {
    const buffer = await fn();
    const outPath = path.join(OUT_DIR, file);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${file}  (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nAll ${templates.length} templates written to public/templates/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
