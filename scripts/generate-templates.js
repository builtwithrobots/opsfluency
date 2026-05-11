/**
 * One-time script: generates the 6 SOP starter template DOCX files.
 * Run with: node scripts/generate-templates.js
 * Output:   public/templates/*.docx
 *
 * Regenerate any time the template content needs to change.
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
} = require("docx");

const OUT_DIR = path.join(__dirname, "..", "public", "templates");

// ─── helpers ─────────────────────────────────────────────────────────────────

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 80 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    spacing: { after: 120 },
  });
}

function placeholder(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: `[${text}]`,
        size: 24,
        color: "888888",
        italics: true,
      }),
    ],
    spacing: { after: 120 },
  });
}

function numberedStep(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 24 }),
      new TextRun({ text, size: 24 }),
    ],
    spacing: { after: 100 },
    indent: { left: 360 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", bold: true, size: 24 }),
      new TextRun({ text, size: 24 }),
    ],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

function checkItem(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "☐  ", size: 24 }),
      new TextRun({ text, size: 24 }),
    ],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
    spacing: { before: 200, after: 200 },
  });
}

function footer() {
  return new Paragraph({
    children: [
      new TextRun({
        text: "OpsFluency SOP Template — download, edit, then upload at your OpsFluency dashboard.",
        size: 18,
        color: "999999",
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
  });
}

function simpleTable(headers, rows) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 22 })],
          }),
        ],
        shading: { fill: "F3F4F6" },
      })
  );

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 22 })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
  });
}

// ─── template definitions ────────────────────────────────────────────────────

async function makeMachineStartup() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("Machine Startup & Shutdown Procedure"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Equipment: "),
          placeholder("EQUIPMENT NAME / MODEL"),
          body("Effective Date: "),
          placeholder("DATE"),
          divider(),

          heading2("1. Purpose"),
          body(
            "This procedure defines the steps required to safely start up and shut down [EQUIPMENT NAME]. " +
              "Following this procedure protects workers from injury and prevents equipment damage."
          ),

          heading2("2. Required Personnel"),
          bullet("[JOB TITLE] — performs startup and shutdown"),
          bullet("[JOB TITLE] — verifies lockout/tagout if applicable"),

          heading2("3. Required PPE"),
          bullet("[PPE ITEM — e.g., Safety glasses]"),
          bullet("[PPE ITEM — e.g., Steel-toed boots]"),
          bullet("[PPE ITEM — e.g., Hearing protection]"),

          heading2("4. Pre-Startup Safety Checks"),
          numberedStep(1, "Confirm the area around the machine is clear of personnel and obstructions."),
          numberedStep(2, "Inspect the machine for visible damage, leaks, or loose components."),
          numberedStep(3, "[ADD SITE-SPECIFIC CHECK]"),
          numberedStep(4, "[ADD SITE-SPECIFIC CHECK]"),
          numberedStep(5, "Verify all guards and safety devices are in place."),

          heading2("5. Startup Steps"),
          numberedStep(1, "[STEP — e.g., Turn the main power switch to ON.]"),
          numberedStep(2, "[STEP — e.g., Wait for the control panel to initialize (approx. X seconds).]"),
          numberedStep(3, "[STEP — e.g., Set operating speed to [DEFAULT SETTING].]"),
          numberedStep(4, "[STEP — e.g., Run a no-load test cycle and confirm normal operation.]"),
          numberedStep(5, "[STEP — add more as needed]"),

          heading2("6. Normal Operation Notes"),
          bullet("[NOTE — e.g., Do not exceed [SPEED/LOAD LIMIT].]"),
          bullet("[NOTE — e.g., Check [PARAMETER] every [INTERVAL].]"),
          placeholder("ADD ANY ADDITIONAL OPERATING NOTES"),

          heading2("7. Shutdown Steps"),
          numberedStep(1, "[STEP — e.g., Reduce operating speed to idle.]"),
          numberedStep(2, "[STEP — e.g., Wait [X seconds] for the system to idle.]"),
          numberedStep(3, "[STEP — e.g., Turn the main power switch to OFF.]"),
          numberedStep(4, "[STEP — e.g., Apply lockout/tagout if maintenance will follow.]"),
          numberedStep(5, "[STEP — add more as needed]"),

          heading2("8. Emergency Shutdown"),
          body(
            "If an unsafe condition is detected, press the red EMERGENCY STOP button located at " +
              "[LOCATION ON MACHINE]. Do not restart the machine until the cause has been identified " +
              "and corrected by [AUTHORIZED PERSON/TITLE]."
          ),

          heading2("9. Documentation"),
          body("Record each startup/shutdown in the equipment log:"),
          placeholder("LOGBOOK LOCATION / SYSTEM NAME"),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makeForkliftInspection() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("Forklift Pre-Shift Inspection"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Forklift Unit ID: "),
          placeholder("UNIT ID / LICENSE PLATE"),
          body("Effective Date: "),
          placeholder("DATE"),
          divider(),

          heading2("1. Purpose"),
          body(
            "Every operator must complete this inspection before operating a forklift. " +
              "If any item fails, the forklift must be tagged OUT OF SERVICE and a supervisor notified " +
              "before it is used."
          ),

          heading2("2. Before You Start"),
          bullet("Park forklift on a level surface with forks lowered."),
          bullet("Turn the ignition to OFF before beginning the physical inspection."),
          bullet("[ADD SITE-SPECIFIC PRE-INSPECTION REQUIREMENT]"),

          heading2("3. Visual Inspection"),
          numberedStep(1, "Tires/wheels — check for damage, low pressure, or missing lug nuts."),
          numberedStep(2, "Forks — check for cracks, bends, or uneven tine height."),
          numberedStep(3, "Mast and carriage — check for bent rails, loose chains, or visible damage."),
          numberedStep(4, "Battery/fuel — check charge level or fuel level; inspect for leaks."),
          numberedStep(5, "Overhead guard — confirm it is intact and secure."),
          numberedStep(6, "Lights and horn — verify all function correctly."),
          numberedStep(7, "[ADD SITE-SPECIFIC VISUAL CHECK]"),

          heading2("4. Operational Check (engine running)"),
          numberedStep(1, "Brakes — test for firm stopping response."),
          numberedStep(2, "Steering — confirm smooth response in both directions."),
          numberedStep(3, "Lift/lower/tilt — operate through full range; confirm no sluggishness or jerking."),
          numberedStep(4, "Horn — confirm audible at distance."),
          numberedStep(5, "Seatbelt / restraint system — confirm it latches and releases cleanly."),
          numberedStep(6, "[ADD SITE-SPECIFIC OPERATIONAL CHECK]"),

          heading2("5. If Issues Are Found"),
          bullet("Tag the forklift OUT OF SERVICE using the red tag located at [LOCATION]."),
          bullet("Notify [SUPERVISOR TITLE / NAME] immediately."),
          bullet("Do not operate the forklift until it has been inspected and cleared by [AUTHORIZED PERSON]."),

          heading2("6. Completion & Sign-off"),
          body("Sign the pre-shift inspection log before beginning operations:"),
          placeholder("LOGBOOK LOCATION / DIGITAL SYSTEM NAME"),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makeEmergencyContacts() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("Emergency Contacts & Procedures"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Last Updated: "),
          placeholder("DATE"),
          divider(),

          heading2("1. Emergency Numbers"),
          simpleTable(
            ["Emergency", "Number", "When to Call"],
            [
              ["Police / Fire / Medical (911)", "911", "Any life-threatening emergency"],
              ["Facility Security", "[NUMBER]", "Trespassers, theft, access issues"],
              ["Facility Manager (on-call)", "[NAME] — [NUMBER]", "After-hours incidents"],
              ["[ADD CONTACT]", "[NUMBER]", "[SITUATION]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("2. Internal Emergency Contacts by Role"),
          simpleTable(
            ["Role", "Name", "Phone / Radio Channel"],
            [
              ["Safety Officer", "[NAME]", "[PHONE / CHANNEL]"],
              ["HR Manager", "[NAME]", "[PHONE / CHANNEL]"],
              ["Maintenance Lead", "[NAME]", "[PHONE / CHANNEL]"],
              ["[ADD ROLE]", "[NAME]", "[PHONE / CHANNEL]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("3. Evacuation Routes"),
          body(
            "Primary evacuation route: [DESCRIBE ROUTE — e.g., Exit through the north fire door, " +
              "proceed to the parking lot assembly area.]"
          ),
          body(
            "Secondary evacuation route (if primary is blocked): [DESCRIBE ALTERNATE ROUTE]"
          ),
          placeholder("ATTACH OR REFERENCE FACILITY FLOOR PLAN WITH EXITS MARKED"),

          heading2("4. Assembly Points"),
          simpleTable(
            ["Zone / Area", "Assembly Point Location"],
            [
              ["[ZONE A]", "[DESCRIPTION / LANDMARK]"],
              ["[ZONE B]", "[DESCRIPTION / LANDMARK]"],
              ["[ADD ZONE]", "[DESCRIPTION / LANDMARK]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("5. After an Incident"),
          numberedStep(1, "Ensure all personnel are accounted for at the assembly point."),
          numberedStep(2, "Notify [ROLE] of any injuries or unaccounted personnel."),
          numberedStep(3, "Do not re-enter the building until [AUTHORITY — e.g., fire department] clears it."),
          numberedStep(4, "Complete an incident report within [TIMEFRAME] at [LOCATION / SYSTEM]."),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makeEquipmentSpecs() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("Equipment Specifications Reference"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Department: "),
          placeholder("DEPARTMENT NAME"),
          body("Last Updated: "),
          placeholder("DATE"),
          divider(),

          heading2("1. Equipment Inventory"),
          simpleTable(
            ["Equipment Name", "Unit ID", "Location", "Status"],
            [
              ["[EQUIPMENT NAME]", "[ID]", "[LOCATION]", "Active"],
              ["[EQUIPMENT NAME]", "[ID]", "[LOCATION]", "Active"],
              ["[EQUIPMENT NAME]", "[ID]", "[LOCATION]", "[STATUS]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("2. Operating Parameters"),
          simpleTable(
            ["Equipment", "Parameter", "Normal Range", "Do Not Exceed"],
            [
              ["[EQUIPMENT]", "[e.g., Operating Temp]", "[RANGE]", "[LIMIT]"],
              ["[EQUIPMENT]", "[e.g., Max Load]", "[RANGE]", "[LIMIT]"],
              ["[EQUIPMENT]", "[PARAMETER]", "[RANGE]", "[LIMIT]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("3. Preventive Maintenance Schedule"),
          simpleTable(
            ["Equipment", "Task", "Frequency", "Performed By"],
            [
              ["[EQUIPMENT]", "[e.g., Lubricate bearings]", "[e.g., Weekly]", "[ROLE]"],
              ["[EQUIPMENT]", "[e.g., Replace filters]", "[e.g., Monthly]", "[ROLE]"],
              ["[EQUIPMENT]", "[TASK]", "[FREQUENCY]", "[ROLE]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("4. Common Replacement Parts"),
          simpleTable(
            ["Equipment", "Part Name", "Part Number", "Supplier"],
            [
              ["[EQUIPMENT]", "[PART NAME]", "[PART #]", "[SUPPLIER]"],
              ["[EQUIPMENT]", "[PART NAME]", "[PART #]", "[SUPPLIER]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("5. Maintenance Contacts"),
          body("Internal maintenance contact: "),
          placeholder("NAME / TITLE / PHONE"),
          body("Equipment vendor / service contract: "),
          placeholder("COMPANY NAME / PHONE / ACCOUNT #"),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makeDailySafetyInspection() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("Daily Safety Inspection Checklist"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Area / Shift: "),
          placeholder("AREA / SHIFT"),
          body("Inspector Name: ________________  Date: ______________  Signature: ________________"),
          divider(),

          heading2("Pre-Shift Checks"),
          checkItem("Emergency exits are unobstructed and clearly marked."),
          checkItem("Fire extinguishers are in place, charged, and accessible."),
          checkItem("First-aid kit is stocked and accessible at [LOCATION]."),
          checkItem("Emergency contact information is posted and current."),
          checkItem("[ADD SITE-SPECIFIC PRE-SHIFT ITEM]"),

          heading2("Work Area"),
          checkItem("Aisles and walkways are clear of obstructions."),
          checkItem("Floors are clean and dry; spills have been cleaned up."),
          checkItem("Hazardous materials are properly labeled and stored."),
          checkItem("Waste bins are not overflowing."),
          checkItem("[ADD SITE-SPECIFIC AREA ITEM]"),
          checkItem("[ADD SITE-SPECIFIC AREA ITEM]"),

          heading2("Equipment & Machinery"),
          checkItem("All guards and safety devices are in place on active machinery."),
          checkItem("Equipment lockout/tagout tags are respected and intact."),
          checkItem("Electrical cords and panels show no visible damage."),
          checkItem("[SPECIFIC EQUIPMENT — e.g., Conveyor belt] is operating normally."),
          checkItem("[ADD SITE-SPECIFIC EQUIPMENT ITEM]"),

          heading2("PPE"),
          checkItem("Required PPE is available and in good condition at the workstation."),
          checkItem("Damaged PPE has been removed from service and replaced."),
          checkItem("[ADD SITE-SPECIFIC PPE ITEM]"),

          heading2("Issues Found"),
          body(
            "Describe any failed items, corrective actions taken, and items that require follow-up:"
          ),
          placeholder("DESCRIBE ISSUES AND CORRECTIVE ACTIONS — or write 'None'"),

          heading2("Sign-Off"),
          body("Inspected by: ________________________________  Time completed: __________"),
          body("Reviewed by (supervisor): ____________________  Date: ___________________"),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makePpeRequirements() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading1("PPE Requirements by Task"),
          body("Facility: "),
          placeholder("FACILITY NAME"),
          body("Department: "),
          placeholder("DEPARTMENT NAME"),
          body("Effective Date: "),
          placeholder("DATE"),
          divider(),

          heading2("1. Required PPE by Task"),
          body(
            "Use the table below to determine which PPE is required before starting each task. " +
              "'Required' means mandatory. 'Recommended' means strongly advised. 'N/A' means not applicable."
          ),
          simpleTable(
            ["Task", "Hard Hat", "Safety Glasses", "Gloves", "Hi-Vis Vest", "Steel-Toe Boots", "Hearing Protection", "Other"],
            [
              ["[TASK — e.g., Forklift operation]", "Required", "Required", "Recommended", "Required", "Required", "Required", "[SPECIFY]"],
              ["[TASK — e.g., Chemical handling]", "N/A", "Required", "Required", "N/A", "Required", "N/A", "Face shield"],
              ["[TASK — e.g., Loading dock]", "Recommended", "Required", "Recommended", "Required", "Required", "N/A", "N/A"],
              ["[ADD TASK]", "[LEVEL]", "[LEVEL]", "[LEVEL]", "[LEVEL]", "[LEVEL]", "[LEVEL]", "[SPECIFY]"],
            ]
          ),
          new Paragraph({ spacing: { after: 200 } }),

          heading2("2. PPE Inspection Procedure"),
          body("Before each use, inspect your PPE:"),
          numberedStep(1, "Hard hat — check shell for cracks, dents, or penetration; check suspension for fraying."),
          numberedStep(2, "Safety glasses/face shield — check for scratches that obscure vision or broken frames."),
          numberedStep(3, "Gloves — check for holes, tears, or chemical degradation."),
          numberedStep(4, "Hi-vis vest — confirm reflective strips are intact and not faded."),
          numberedStep(5, "[ADD SITE-SPECIFIC PPE INSPECTION STEP]"),

          heading2("3. When to Replace PPE"),
          checkItem("After any impact or incident that may have compromised protection."),
          checkItem("When visible damage (cracks, tears, worn reflectors) is found during inspection."),
          checkItem("On a scheduled basis: [SPECIFY REPLACEMENT SCHEDULE PER ITEM TYPE]."),
          checkItem("[ADD SITE-SPECIFIC REPLACEMENT TRIGGER]"),

          heading2("4. Where to Get PPE"),
          body("PPE is available at: "),
          placeholder("LOCATION — e.g., Safety supply cabinet in Warehouse B, Room 12"),
          body("Contact for PPE issues or replacements: "),
          placeholder("NAME / TITLE / PHONE"),

          divider(),
          footer(),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const templates = [
    { fn: makeMachineStartup,       file: "sop-startup-shutdown.docx" },
    { fn: makeForkliftInspection,   file: "sop-forklift-inspection.docx" },
    { fn: makeEmergencyContacts,    file: "sop-emergency-contacts.docx" },
    { fn: makeEquipmentSpecs,       file: "sop-equipment-specs.docx" },
    { fn: makeDailySafetyInspection, file: "sop-daily-safety-inspection.docx" },
    { fn: makePpeRequirements,      file: "sop-ppe-requirements.docx" },
  ];

  for (const { fn, file } of templates) {
    const buffer = await fn();
    const outPath = path.join(OUT_DIR, file);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${file}`);
  }

  console.log(`\nAll ${templates.length} templates written to public/templates/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
