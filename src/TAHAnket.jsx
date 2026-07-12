import { useState, useCallback, useEffect } from "react";
import { exportElementToPdf } from "./exportPdf.js";
import { SKILLS_LEFT, SKILLS_RIGHT, COMM_CATS, OFFICE_APPS } from "./skills.js";
import OfficialForm from "./OfficialForm.jsx";

const STEPS = [
  "Хувь хүний мэдээлэл",
  "Гэр бүл, төрөл садан",
  "Боловсрол",
  "Ур чадвар",
  "Гадаад хэл, компьютер",
  "Ажил эрхлэлт",
  "Хэсэг Б",
];

const emptyFamilyRow = () => ({ relation: "", name: "", regNo: "", birthPlace: "", job: "" });
const emptyRelativeRow = () => ({ relation: "", name: "", birthYear: "", birthPlace: "", job: "" });
const emptyEduRow = () => ({ school: "", enrolled: "", major: "", diploma: "" });
const emptyScholarshipRow = () => ({ school: "", enrolled: "", major: "", diploma: "" });
const emptyDoctoralRow = () => ({ type: "", place: "", date: "", diploma: "" });
const emptyLangRow = () => ({ lang: "", listen: "", speak: "", read: "", write: "" });
const emptyWorkRow = () => ({ org: "", dept: "", position: "", startDate: "", endDate: "", note: "" });
const emptyRankRow = () => ({ category: "", rank: "", date: "", idNo: "" });
const emptyMilitaryRow = () => ({ idNo: "", status: "", note: "" });
const emptyCrimeRow = () => ({ court: "", article: "", decision: "", reason: "" });
const emptyDisciplineRow = () => ({ org: "", penalty: "", decision: "", reason: "" });
const emptyTrainingRow = () => ({ place: "", dates: "", field: "", degree: "", certNo: "" });
const emptyAwardRow = () => ({ name: "", date: "", decision: "", reason: "" });
const emptyCompensationRow = () => ({ name: "", amount: "", date: "", decision: "", reason: "" });

// --- LOCAL PERSISTENCE ---
// The entered data is saved to localStorage (which the Android WebView keeps
// across app restarts) so the form is restored the next time the app opens.
const STORAGE_KEY = "tah-anket-form-v1";

const DEFAULT_PERSONAL = {
  regNo: "", citizenship: "", familyName: "", fatherName: "", firstName: "",
  gender: "", birthYear: "", birthMonth: "", birthDay: "",
  ethnicity: "", birthAimag: "", birthSum: "", birthPlace: "",
  permAimag: "", permSum: "", permBag: "", permKhoroo: "", permBair: "", permToot: "",
  tempAimag: "", tempSum: "", tempBag: "", tempKhoroo: "", tempBair: "", tempToot: "",
  phone: "", mobile: "", email: "",
  emergencyName: "", emergencyPhone: "",
  maritalStatus: "",
};

const DEFAULT_TECH = {
  internet: "", intranet: "",
  scanner: false, printer: false, copier: false, fax: false,
  photo: false, video: false, recorder: false,
};

const DEFAULT_SECTION_B = {
  parentName: "", firstName: "",
  mentalYes: false, mentalNo: false, mentalDetails: "", mentalOrg: "",
  consent: false, signFather: "", signFirst: "", signDate: "",
};

const DEFAULT_EXAM_ROWS = [
  { type: "Төрийн албаны ерөнхий шалгалт өгч тэнцсэн эсэх", yesNo: "", note: "" },
  { type: "Төрийн албанд нөөцөд байгаа эсэх", yesNo: "", note: "" },
  { type: "Төрийн албаны тусгай шалгалт өгсөн эсэх", yesNo: "", note: "" },
];

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Returns the saved array when present, otherwise a fresh default row list.
function rowsOr(saved, factory) {
  return Array.isArray(saved) ? saved : [factory()];
}

const S = {
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 },
};

// --- COMPONENTS ---
// Defined at module scope (not inside TAHAnket) so their identity is stable
// across re-renders. Otherwise every keystroke would remount the inputs and
// steal focus, closing the on-screen keyboard after a single character.
const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={S.label}>{label}</label>
    <input className="fi" type={type} value={value || ""}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={S.label}>{label}</label>
    <select className="fi" value={value || ""} onChange={e => onChange(e.target.value)}>
      <option value="">-- Сонгох --</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const RatingSelect = ({ skillKey, stateObj, setter }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {[1, 2, 3].map(n => (
      <button key={n} className={`rbtn ${stateObj[skillKey] === n ? "rbtn-on" : ""}`}
        onClick={() => setter(s => ({ ...s, [skillKey]: n }))}>
        {n}
      </button>
    ))}
  </div>
);

const DynamicTable = ({ columns, rows, updateRow, addRowFn, removeRowFn }) => (
  <div style={{ overflowX: "auto" }}>
    <table className="dtable">
      <thead>
        <tr>
          <th style={{ width: 30 }}>№</th>
          {columns.map(c => <th key={c.key}>{c.label}</th>)}
          <th style={{ width: 36 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td style={{ textAlign: "center", color: "#9ca3af" }}>{i + 1}</td>
            {columns.map(c => (
              <td key={c.key}>
                <input className="tdi" value={row[c.key] || ""}
                  onChange={e => updateRow(i, c.key, e.target.value)} placeholder={c.ph || ""} />
              </td>
            ))}
            <td>
              <button className="rm-btn" onClick={() => removeRowFn(i)}>✕</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <button className="add-btn" onClick={addRowFn}>+ Мөр нэмэх</button>
  </div>
);

export default function TAHAnket() {
  // Loaded once on mount from localStorage (empty object on first run).
  const [saved] = useState(loadPersisted);

  const [step, setStep] = useState(0);

  const [personal, setPersonal] = useState(() => ({ ...DEFAULT_PERSONAL, ...(saved.personal || {}) }));

  const [familyRows, setFamilyRows] = useState(() => rowsOr(saved.familyRows, emptyFamilyRow));
  const [relativeRows, setRelativeRows] = useState(() => rowsOr(saved.relativeRows, emptyRelativeRow));
  const [eduRows, setEduRows] = useState(() => rowsOr(saved.eduRows, emptyEduRow));
  const [scholarshipRows, setScholarshipRows] = useState(() => rowsOr(saved.scholarshipRows, emptyScholarshipRow));
  const [doctoralRows, setDoctoralRows] = useState(() => rowsOr(saved.doctoralRows, emptyDoctoralRow));
  const [noEducation, setNoEducation] = useState(() => saved.noEducation || false);
  const [phdTopic, setPhdTopic] = useState(() => saved.phdTopic || "");
  const [scdTopic, setScdTopic] = useState(() => saved.scdTopic || "");
  const [skills, setSkills] = useState(() => saved.skills || {});
  const [commSkills, setCommSkills] = useState(() => saved.commSkills || {});
  const [langRows, setLangRows] = useState(() => rowsOr(saved.langRows, emptyLangRow));
  const [langExams, setLangExams] = useState(() => saved.langExams || "");
  const [officeSkills, setOfficeSkills] = useState(() => saved.officeSkills || {});
  const [techSkills, setTechSkills] = useState(() => ({ ...DEFAULT_TECH, ...(saved.techSkills || {}) }));
  const [workRows, setWorkRows] = useState(() => rowsOr(saved.workRows, emptyWorkRow));
  const [rankRows, setRankRows] = useState(() => rowsOr(saved.rankRows, emptyRankRow));
  const [militaryRows, setMilitaryRows] = useState(() => rowsOr(saved.militaryRows, emptyMilitaryRow));

  const [sectionB, setSectionB] = useState(() => ({ ...DEFAULT_SECTION_B, ...(saved.sectionB || {}) }));
  const [examRows, setExamRows] = useState(() => (
    Array.isArray(saved.examRows) && saved.examRows.length ? saved.examRows : DEFAULT_EXAM_ROWS
  ));
  const [crimeRows, setCrimeRows] = useState(() => rowsOr(saved.crimeRows, emptyCrimeRow));
  const [disciplineRows, setDisciplineRows] = useState(() => rowsOr(saved.disciplineRows, emptyDisciplineRow));
  const [trainingRows, setTrainingRows] = useState(() => rowsOr(saved.trainingRows, emptyTrainingRow));
  const [awardRows, setAwardRows] = useState(() => rowsOr(saved.awardRows, emptyAwardRow));
  const [compensationRows, setCompensationRows] = useState(() => rowsOr(saved.compensationRows, emptyCompensationRow));

  const updatePersonal = (k, v) => setPersonal(p => ({ ...p, [k]: v }));

  const updateTableRow = useCallback((setter) => (idx, key, val) => {
    setter(rows => rows.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  }, []);

  const addRow = useCallback((setter, factory) => () => setter(r => [...r, factory()]), []);
  const removeRow = useCallback((setter) => (idx) => setter(r => r.length > 1 ? r.filter((_, i) => i !== idx) : r), []);

  // Persist all entered data to localStorage on every change so it survives
  // closing/reopening the app.
  useEffect(() => {
    const data = {
      personal, familyRows, relativeRows, eduRows, scholarshipRows, doctoralRows,
      noEducation, phdTopic, scdTopic, skills, commSkills, langRows, langExams,
      officeSkills, techSkills, workRows, rankRows, militaryRows, sectionB,
      examRows, crimeRows, disciplineRows, trainingRows, awardRows, compensationRows,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage write errors (e.g. quota / private mode).
    }
  }, [
    personal, familyRows, relativeRows, eduRows, scholarshipRows, doctoralRows,
    noEducation, phdTopic, scdTopic, skills, commSkills, langRows, langExams,
    officeSkills, techSkills, workRows, rankRows, militaryRows, sectionB,
    examRows, crimeRows, disciplineRows, trainingRows, awardRows, compensationRows,
  ]);

  const handleClearAll = () => {
    if (!window.confirm("Хадгалсан бүх мэдээллийг устгаж, шинэ анкет эхлүүлэх үү?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setPersonal({ ...DEFAULT_PERSONAL });
    setFamilyRows([emptyFamilyRow()]);
    setRelativeRows([emptyRelativeRow()]);
    setEduRows([emptyEduRow()]);
    setScholarshipRows([emptyScholarshipRow()]);
    setDoctoralRows([emptyDoctoralRow()]);
    setNoEducation(false);
    setPhdTopic("");
    setScdTopic("");
    setSkills({});
    setCommSkills({});
    setLangRows([emptyLangRow()]);
    setLangExams("");
    setOfficeSkills({});
    setTechSkills({ ...DEFAULT_TECH });
    setWorkRows([emptyWorkRow()]);
    setRankRows([emptyRankRow()]);
    setMilitaryRows([emptyMilitaryRow()]);
    setSectionB({ ...DEFAULT_SECTION_B });
    setExamRows(DEFAULT_EXAM_ROWS.map(r => ({ ...r })));
    setCrimeRows([emptyCrimeRow()]);
    setDisciplineRows([emptyDisciplineRow()]);
    setTrainingRows([emptyTrainingRow()]);
    setAwardRows([emptyAwardRow()]);
    setCompensationRows([emptyCompensationRow()]);
    setStep(0);
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      // Give React a frame to render every step into #form-content before capture.
      await new Promise(r => setTimeout(r, 60));
      await exportElementToPdf(document.getElementById("form-content"), "ТАХ-Анкет.pdf");
    } catch (e) {
      alert("PDF үүсгэхэд алдаа гарлаа: " + (e && e.message ? e.message : e));
    } finally {
      setExporting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const renderStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0: return (<>
        <div className="card">
          <div className="stitle">Нэг. Хувь хүний талаарх мэдээлэл</div>
          <Field label="Регистрийн дугаар" value={personal.regNo} onChange={v => updatePersonal("regNo", v)} placeholder="АА00000000" />
          <Field label="1.1. Иргэншил" value={personal.citizenship} onChange={v => updatePersonal("citizenship", v)} placeholder="Монгол" />
          <Field label="1.2. Ургийн овог" value={personal.familyName} onChange={v => updatePersonal("familyName", v)} />
          <Field label="1.3. Эцэг (эх)-ийн нэр" value={personal.fatherName} onChange={v => updatePersonal("fatherName", v)} />
          <Field label="1.4. Өөрийн нэр" value={personal.firstName} onChange={v => updatePersonal("firstName", v)} />
          <SelectField label="1.5. Хүйс" value={personal.gender} onChange={v => updatePersonal("gender", v)} options={["Эрэгтэй", "Эмэгтэй"]} />
          <label style={S.label}>1.6. Төрсөн он сар өдөр</label>
          <div className="row3">
            <input className="fi" placeholder="Он" value={personal.birthYear || ""} onChange={e => updatePersonal("birthYear", e.target.value)} />
            <input className="fi" placeholder="Сар" value={personal.birthMonth || ""} onChange={e => updatePersonal("birthMonth", e.target.value)} />
            <input className="fi" placeholder="Өдөр" value={personal.birthDay || ""} onChange={e => updatePersonal("birthDay", e.target.value)} />
          </div>
          <div style={{ height: 10 }} />
          <Field label="1.7. Үндэс, угсаа" value={personal.ethnicity} onChange={v => updatePersonal("ethnicity", v)} />
        </div>
        <div className="card">
          <div className="stitle">1.8. Төрсөн аймаг, хот</div>
          <div className="row2">
            <Field label="Аймаг, хот" value={personal.birthAimag} onChange={v => updatePersonal("birthAimag", v)} />
            <Field label="Сум, дүүрэг" value={personal.birthSum} onChange={v => updatePersonal("birthSum", v)} />
          </div>
          <Field label="Төрсөн газар" value={personal.birthPlace} onChange={v => updatePersonal("birthPlace", v)} />
        </div>
        <div className="card">
          <div className="stitle">1.9. Байнгын оршин суугаа хаяг</div>
          <div className="row2">
            <Field label="Аймаг, хот" value={personal.permAimag} onChange={v => updatePersonal("permAimag", v)} />
            <Field label="Сум, дүүрэг" value={personal.permSum} onChange={v => updatePersonal("permSum", v)} />
          </div>
          <div className="row2">
            <Field label="Баг, хороо" value={personal.permBag} onChange={v => updatePersonal("permBag", v)} />
            <Field label="Хороолол" value={personal.permKhoroo} onChange={v => updatePersonal("permKhoroo", v)} />
          </div>
          <div className="row2">
            <Field label="Байр, гудамж" value={personal.permBair} onChange={v => updatePersonal("permBair", v)} />
            <Field label="Тоот" value={personal.permToot} onChange={v => updatePersonal("permToot", v)} />
          </div>
        </div>
        <div className="card">
          <div className="stitle">1.9.1. Түр оршин суугаа хаяг</div>
          <div className="row2">
            <Field label="Аймаг, хот" value={personal.tempAimag} onChange={v => updatePersonal("tempAimag", v)} />
            <Field label="Сум, дүүрэг" value={personal.tempSum} onChange={v => updatePersonal("tempSum", v)} />
          </div>
          <div className="row2">
            <Field label="Баг, хороо" value={personal.tempBag} onChange={v => updatePersonal("tempBag", v)} />
            <Field label="Хороолол" value={personal.tempKhoroo} onChange={v => updatePersonal("tempKhoroo", v)} />
          </div>
          <div className="row2">
            <Field label="Байр, гудамж" value={personal.tempBair} onChange={v => updatePersonal("tempBair", v)} />
            <Field label="Тоот" value={personal.tempToot} onChange={v => updatePersonal("tempToot", v)} />
          </div>
        </div>
        <div className="card">
          <div className="stitle">1.10. Холбоо барих</div>
          <Field label="Суурин утас" value={personal.phone} onChange={v => updatePersonal("phone", v)} />
          <Field label="Гар утас" value={personal.mobile} onChange={v => updatePersonal("mobile", v)} />
          <Field label="Цахим шуудан" value={personal.email} onChange={v => updatePersonal("email", v)} type="email" />
        </div>
        <div className="card">
          <div className="stitle">1.11. Яаралтай үед холбоо барих хүн</div>
          <Field label="Нэр" value={personal.emergencyName} onChange={v => updatePersonal("emergencyName", v)} />
          <Field label="Утас" value={personal.emergencyPhone} onChange={v => updatePersonal("emergencyPhone", v)} />
        </div>
      </>);

      case 1: return (<>
        <div className="card">
          <div className="stitle">1.12. Гэрлэлтийн байдал</div>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            {["Гэрлэсэн", "Гэрлээгүй"].map(v => (
              <label key={v} className="rlabel">
                <input type="radio" name="marital" value={v} checked={personal.maritalStatus === v}
                  onChange={() => updatePersonal("maritalStatus", v)} className="chk" /> {v}
              </label>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="stitle">1.12.2. Гэр бүлийн байдал</div>
          <p className="note">Зөвхөн гэр бүлийн бүртгэлд байгаа хүмүүсийг бичнэ</p>
          <DynamicTable columns={[
            { key: "relation", label: "Таны юу болох" },
            { key: "name", label: "Эцэг/эх, өөрийн нэр" },
            { key: "regNo", label: "Регистрийн дугаар" },
            { key: "birthPlace", label: "Төрсөн аймаг, хот" },
            { key: "job", label: "Одоо эрхэлж буй ажил" },
          ]} rows={familyRows} updateRow={updateTableRow(setFamilyRows)}
            addRowFn={addRow(setFamilyRows, emptyFamilyRow)} removeRowFn={removeRow(setFamilyRows)} />
        </div>
        <div className="card">
          <div className="stitle">1.13. Садан төрлийн байдал</div>
          <p className="note">Эцэг, эх, төрсөн ах, эгч, дүү, өрх тусгаарласан хүүхдийг оруулна</p>
          <DynamicTable columns={[
            { key: "relation", label: "Таны юу болох" },
            { key: "name", label: "Эцэг/эх, өөрийн нэр" },
            { key: "birthYear", label: "Төрсөн он" },
            { key: "birthPlace", label: "Төрсөн аймаг, хот" },
            { key: "job", label: "Одоо эрхэлж буй ажил" },
          ]} rows={relativeRows} updateRow={updateTableRow(setRelativeRows)}
            addRowFn={addRow(setRelativeRows, emptyRelativeRow)} removeRowFn={removeRow(setRelativeRows)} />
        </div>
      </>);

      case 2: return (<>
        <div className="card">
          <div className="stitle">2.1. Боловсрол</div>
          <p className="note">Суурь, бүрэн дунд, мэргэжлийн, дипломын дээд, бакалавр, магистрын зэргийг оруулна</p>
          <DynamicTable columns={[
            { key: "school", label: "Улс, сургуулийн нэр" },
            { key: "enrolled", label: "Элссэн, төгссөн он" },
            { key: "major", label: "Эзэмшсэн мэргэжил" },
            { key: "diploma", label: "Дипломын дугаар" },
          ]} rows={eduRows} updateRow={updateTableRow(setEduRows)}
            addRowFn={addRow(setEduRows, emptyEduRow)} removeRowFn={removeRow(setEduRows)} />
          <label className="rlabel" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={noEducation} onChange={e => setNoEducation(e.target.checked)} className="chk" />
            Боловсролгүй
          </label>
        </div>
        <div className="card">
          <div className="stitle">2.2. Тэтгэлэгт хамрагдсан байдал</div>
          <DynamicTable columns={[
            { key: "school", label: "Улс, сургуулийн нэр" },
            { key: "enrolled", label: "Элссэн, төгссөн он" },
            { key: "major", label: "Эзэмшсэн мэргэжил" },
            { key: "diploma", label: "Дипломын дугаар" },
          ]} rows={scholarshipRows} updateRow={updateTableRow(setScholarshipRows)}
            addRowFn={addRow(setScholarshipRows, emptyScholarshipRow)} removeRowFn={removeRow(setScholarshipRows)} />
        </div>
        <div className="card">
          <div className="stitle">2.3. Докторын зэрэг</div>
          <DynamicTable columns={[
            { key: "type", label: "Зэргийн төрөл" },
            { key: "place", label: "Хамгаалсан газар" },
            { key: "date", label: "Он, сар" },
            { key: "diploma", label: "Дипломын дугаар" },
          ]} rows={doctoralRows} updateRow={updateTableRow(setDoctoralRows)}
            addRowFn={addRow(setDoctoralRows, emptyDoctoralRow)} removeRowFn={removeRow(setDoctoralRows)} />
          <Field label="Ph.D зэрэг хамгаалсан сэдэв" value={phdTopic} onChange={setPhdTopic} />
          <Field label="Sc.D зэрэг хамгаалсан сэдэв" value={scdTopic} onChange={setScdTopic} />
        </div>
      </>);

      case 3: return (<>
        <div className="card">
          <div className="stitle">3.1. Хувь хүний ур чадвар (1-бага, 2-дунд, 3-сайн)</div>
          {[...SKILLS_LEFT, ...SKILLS_RIGHT].map(group => (
            <div key={group.cat} style={{ marginBottom: 16 }}>
              <div className="skill-cat">{group.cat}</div>
              {group.items.map((item, ii) => {
                const key = `S_${group.cat}_${ii}`;
                return (
                  <div key={key} className="skill-row">
                    <span style={{ flex: 1, fontSize: 12, paddingRight: 8 }}>{item}</span>
                    <RatingSelect skillKey={key} stateObj={skills} setter={setSkills} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="stitle">5. Харилцааны ур чадвар</div>
          {COMM_CATS.map(group => (
            <div key={group.cat} style={{ marginBottom: 16 }}>
              <div className="skill-cat">{group.cat}</div>
              {group.items.map((item, ii) => {
                const key = `C_${group.cat}_${ii}`;
                return (
                  <div key={key} className="skill-row">
                    <span style={{ flex: 1, fontSize: 12, paddingRight: 8 }}>{item}</span>
                    <RatingSelect skillKey={key} stateObj={commSkills} setter={setCommSkills} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </>);

      case 4: return (<>
        <div className="card">
          <div className="stitle">3.3. Гадаад хэлний мэдлэг</div>
          <DynamicTable columns={[
            { key: "lang", label: "Хэлний нэр", ph: "Англи..." },
            { key: "listen", label: "Сонсож ойлгох" },
            { key: "speak", label: "Ярих" },
            { key: "read", label: "Унших" },
            { key: "write", label: "Бичих" },
          ]} rows={langRows} updateRow={updateTableRow(setLangRows)}
            addRowFn={addRow(setLangRows, emptyLangRow)} removeRowFn={removeRow(setLangRows)} />
          <p className="note" style={{ marginTop: 8 }}>Түвшин: Анхан шат / Дунд шат / Ахисан шат</p>
          <Field label="Хэлний шалгалтын оноо (TOEFL, IELTS г.м)" value={langExams} onChange={setLangExams} />
        </div>
        <div className="card">
          <div className="stitle">3.4. Компьютерийн ур чадвар</div>
          <p className="note" style={{ marginBottom: 8 }}>Оффисын хэрэглээний програм</p>
          <table className="dtable">
            <thead><tr><th>Програм</th><th>Дунд</th><th>Сайн</th><th>Ахисан+</th></tr></thead>
            <tbody>
              {OFFICE_APPS.map(app => (
                <tr key={app}>
                  <td style={{ fontSize: 12, fontWeight: 500, padding: "8px 6px" }}>{app}</td>
                  {["Дунд", "Сайн", "Ахисан"].map(lvl => (
                    <td key={lvl} style={{ textAlign: "center", padding: 6 }}>
                      <input type="radio" name={`o_${app}`} checked={officeSkills[app] === lvl}
                        onChange={() => setOfficeSkills(s => ({ ...s, [app]: lvl }))} className="chk" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <label style={S.label}>Интернэтийн орчинд ажиллах</label>
            <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
              {["Дунд", "Сайн", "Ахисан"].map(lvl => (
                <label key={lvl} className="rlabel">
                  <input type="radio" name="internet" checked={techSkills.internet === lvl}
                    onChange={() => setTechSkills(s => ({ ...s, internet: lvl }))} className="chk" /> {lvl}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={S.label}>Оффисын тоног төхөөрөмж</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
              {[{ key: "scanner", label: "Сканер" }, { key: "printer", label: "Принтер" },
                { key: "copier", label: "Хувилагч" }, { key: "fax", label: "Факс" },
                { key: "photo", label: "Гэрэл зураг" }, { key: "video", label: "Видео" },
                { key: "recorder", label: "Бичлэгийн аппарат" }].map(d => (
                <label key={d.key} className="rlabel">
                  <input type="checkbox" checked={techSkills[d.key] || false}
                    onChange={e => setTechSkills(s => ({ ...s, [d.key]: e.target.checked }))} className="chk" /> {d.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </>);

      case 5: return (<>
        <div className="card">
          <div className="stitle">4.1. Ажил эрхлэлт</div>
          <p className="note">Он цагийн дарааллаар бичнэ</p>
          <DynamicTable columns={[
            { key: "org", label: "Байгууллага" },
            { key: "dept", label: "Газар, нэгж" },
            { key: "position", label: "Албан тушаал" },
            { key: "startDate", label: "Орсон огноо" },
            { key: "endDate", label: "Гарсан огноо" },
            { key: "note", label: "Тайлбар" },
          ]} rows={workRows} updateRow={updateTableRow(setWorkRows)}
            addRowFn={addRow(setWorkRows, emptyWorkRow)} removeRowFn={removeRow(setWorkRows)} />
        </div>
        <div className="card">
          <div className="stitle">4.2. Албан тушаалын зэрэг дэв, цол</div>
          <DynamicTable columns={[
            { key: "category", label: "Ангилал, зэрэглэл" },
            { key: "rank", label: "Зэрэг дэв, цолны нэр" },
            { key: "date", label: "Шийдвэрийн огноо" },
            { key: "idNo", label: "Үнэмлэхийн дугаар" },
          ]} rows={rankRows} updateRow={updateTableRow(setRankRows)}
            addRowFn={addRow(setRankRows, emptyRankRow)} removeRowFn={removeRow(setRankRows)} />
        </div>
        <div className="card">
          <div className="stitle">5. Цэргийн алба хаасан эсэх</div>
          <DynamicTable columns={[
            { key: "idNo", label: "Үнэмлэхийн дугаар" },
            { key: "status", label: "Цэргийн алба хаасан байдал" },
            { key: "note", label: "Тайлбар" },
          ]} rows={militaryRows} updateRow={updateTableRow(setMilitaryRows)}
            addRowFn={addRow(setMilitaryRows, emptyMilitaryRow)} removeRowFn={removeRow(setMilitaryRows)} />
        </div>
      </>);

      case 6: return (<>
        <div className="card">
          <div className="stitle">ХЭСЭГ "Б"</div>
          <div className="row2">
            <Field label="Эцэг (эх)-ийн нэр" value={sectionB.parentName} onChange={v => setSectionB(s => ({ ...s, parentName: v }))} />
            <Field label="Өөрийн нэр" value={sectionB.firstName} onChange={v => setSectionB(s => ({ ...s, firstName: v }))} />
          </div>
        </div>
        <div className="card">
          <div className="stitle">1. Төрийн албаны шалгалт</div>
          <table className="dtable">
            <thead><tr><th>№</th><th>Шалгалтын төрөл</th><th>Тийм/Үгүй</th><th>Тайлбар</th></tr></thead>
            <tbody>
              {examRows.map((row, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "center", padding: 6 }}>{i + 1}</td>
                  <td style={{ fontSize: 11, padding: 6 }}>{row.type}</td>
                  <td style={{ padding: 4 }}>
                    <select className="tdi" value={row.yesNo}
                      onChange={e => setExamRows(r => r.map((x, j) => j === i ? { ...x, yesNo: e.target.value } : x))}>
                      <option value="">--</option><option value="Тийм">Тийм</option><option value="Үгүй">Үгүй</option>
                    </select>
                  </td>
                  <td style={{ padding: 4 }}>
                    <input className="tdi" value={row.note}
                      onChange={e => setExamRows(r => r.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="stitle">2. Сэтгэцийн эрүүл мэндийн мэдээлэл</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            <label className="rlabel"><input type="radio" name="mental" checked={sectionB.mentalYes}
              onChange={() => setSectionB(s => ({ ...s, mentalYes: true, mentalNo: false }))} className="chk" /> Тийм</label>
            <label className="rlabel"><input type="radio" name="mental" checked={sectionB.mentalNo}
              onChange={() => setSectionB(s => ({ ...s, mentalYes: false, mentalNo: true }))} className="chk" /> Үгүй</label>
          </div>
          {sectionB.mentalYes && <>
            <Field label="Тодорхой бичнэ" value={sectionB.mentalDetails} onChange={v => setSectionB(s => ({ ...s, mentalDetails: v }))} />
            <Field label="Байгууллагын нэр" value={sectionB.mentalOrg} onChange={v => setSectionB(s => ({ ...s, mentalOrg: v }))} />
          </>}
        </div>
        <div className="card">
          <div className="stitle">3. Эрүүгийн хуульд заасан гэмт хэрэг</div>
          <DynamicTable columns={[
            { key: "court", label: "Шүүхийн нэр" },
            { key: "article", label: "Хуулийн зүйл, анги" },
            { key: "decision", label: "Тогтоолын огноо" },
            { key: "reason", label: "Үндэслэл" },
          ]} rows={crimeRows} updateRow={updateTableRow(setCrimeRows)}
            addRowFn={addRow(setCrimeRows, emptyCrimeRow)} removeRowFn={removeRow(setCrimeRows)} />
        </div>
        <div className="card">
          <div className="stitle">4. Сахилгын шийтгэл</div>
          <DynamicTable columns={[
            { key: "org", label: "Байгууллага" },
            { key: "penalty", label: "Шийтгэл ногдуулсан" },
            { key: "decision", label: "Шийдвэрийн нэр" },
            { key: "reason", label: "Үндэслэл" },
          ]} rows={disciplineRows} updateRow={updateTableRow(setDisciplineRows)}
            addRowFn={addRow(setDisciplineRows, emptyDisciplineRow)} removeRowFn={removeRow(setDisciplineRows)} />
        </div>
        <div className="card">
          <div className="stitle">5. Мэргэшүүлэх сургалт</div>
          <DynamicTable columns={[
            { key: "place", label: "Байгууллага" },
            { key: "dates", label: "Он, сар, өдөр" },
            { key: "field", label: "Чиглэл" },
            { key: "degree", label: "Зэрэг" },
            { key: "certNo", label: "Гэрчилгээний дугаар" },
          ]} rows={trainingRows} updateRow={updateTableRow(setTrainingRows)}
            addRowFn={addRow(setTrainingRows, emptyTrainingRow)} removeRowFn={removeRow(setTrainingRows)} />
        </div>
        <div className="card">
          <div className="stitle">6. Шагналын мэдээлэл</div>
          <DynamicTable columns={[
            { key: "name", label: "Шагналын нэр" },
            { key: "date", label: "Огноо" },
            { key: "decision", label: "Шийдвэрийн дугаар" },
            { key: "reason", label: "Үндэслэл" },
          ]} rows={awardRows} updateRow={updateTableRow(setAwardRows)}
            addRowFn={addRow(setAwardRows, emptyAwardRow)} removeRowFn={removeRow(setAwardRows)} />
        </div>
        <div className="card">
          <div className="stitle">7. Нөхөх төлбөр, тусламж</div>
          <DynamicTable columns={[
            { key: "name", label: "Нэр" },
            { key: "amount", label: "Дүн (мян.төг)" },
            { key: "date", label: "Олгосон огноо" },
            { key: "decision", label: "Шийдвэр" },
            { key: "reason", label: "Үндэслэл" },
          ]} rows={compensationRows} updateRow={updateTableRow(setCompensationRows)}
            addRowFn={addRow(setCompensationRows, emptyCompensationRow)} removeRowFn={removeRow(setCompensationRows)} />
        </div>
        <div className="card">
          <div className="stitle">Баталгаа</div>
          <label className="rlabel" style={{ alignItems: "flex-start", marginBottom: 16 }}>
            <input type="checkbox" checked={sectionB.consent}
              onChange={e => setSectionB(s => ({ ...s, consent: e.target.checked }))} className="chk" style={{ marginTop: 3 }} />
            <span style={{ fontSize: 12, lineHeight: 1.6 }}>
              Төрийн байгууллагуудын мэдээллийн санд байгаа өөрийн цахим мэдээллийг албан хэрэгцээнд зориулан
              төрийн байгууллагуудын мэдээллийн систем хооронд дамжуулан ашиглахыг зөвшөөрч байна.
            </span>
          </label>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Анкетаа үнэн бичсэн:</p>
          <div className="row2">
            <Field label="Эцэг (эх)-ийн нэр" value={sectionB.signFather} onChange={v => setSectionB(s => ({ ...s, signFather: v }))} />
            <Field label="Өөрийн нэр" value={sectionB.signFirst} onChange={v => setSectionB(s => ({ ...s, signFirst: v }))} />
          </div>
          <Field label="Он, сар, өдөр" value={sectionB.signDate} onChange={v => setSectionB(s => ({ ...s, signDate: v }))} placeholder="2026-07-11" />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="export-btn" onClick={handleExport} disabled={exporting}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {exporting ? "PDF үүсгэж байна..." : "PDF хэлбэрээр татах"}
            </button>
            <p className="note" style={{ marginTop: 8 }}>Бүх хэсгийг нэгтгэн PDF файл болгон хадгална</p>
          </div>
        </div>
      </>);

      default: return null;
    }
  };

  // While exporting we render the official state-template layout (filled with
  // the entered data) so the PDF matches the official form; otherwise only the
  // current step's editing UI is shown.
  const exportData = {
    personal, familyRows, relativeRows, eduRows, scholarshipRows, doctoralRows,
    noEducation, phdTopic, scdTopic, skills, commSkills, langRows, langExams,
    officeSkills, techSkills, workRows, rankRows, militaryRows, sectionB,
    examRows, crimeRows, disciplineRows, trainingRows, awardRows, compensationRows,
  };

  const renderBody = () => (
    exporting
      ? <OfficialForm data={exportData} />
      : renderStepContent(step)
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card { background: #fff; border-radius: 10px; padding: 20px 16px; margin: 10px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .stitle { font-size: 14px; font-weight: 700; color: #1a3a5c; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2.5px solid #c9a84c; }
        .note { font-size: 11px; color: #9ca3af; margin-bottom: 8px; line-height: 1.5; }

        .fi { width: 100%; padding: 10px 12px; border-radius: 7px; border: 1px solid #d1d5db; font-size: 14px; background: #f9fafb; outline: none; transition: border 0.2s; font-family: inherit; }
        .fi:focus { border-color: #2c5f8a; box-shadow: 0 0 0 3px rgba(44,95,138,0.1); }
        select.fi { appearance: auto; }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }

        .rlabel { display: flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; padding: 3px 0; }
        .chk { width: 18px; height: 18px; cursor: pointer; accent-color: #1a3a5c; }

        .dtable { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
        .dtable thead th { background: #1a3a5c; color: #fff; padding: 8px 6px; font-size: 10px; font-weight: 600; text-align: left; white-space: nowrap; }
        .dtable tbody td { padding: 3px; border-bottom: 1px solid #e5e7eb; }

        .tdi { width: 100%; padding: 7px 8px; border: 1px solid #e5e7eb; border-radius: 5px; font-size: 12px; background: #f9fafb; font-family: inherit; outline: none; }
        .tdi:focus { border-color: #2c5f8a; }
        select.tdi { appearance: auto; min-width: 70px; }

        .add-btn { display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px; margin-top: 8px; border-radius: 6px;
          border: 1.5px dashed #2c5f8a; background: transparent; color: #2c5f8a; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .add-btn:hover { background: #f0f7ff; }

        .rm-btn { padding: 4px 8px; border: none; border-radius: 5px; background: #fee2e2; color: #dc2626; font-size: 11px; cursor: pointer; font-weight: 700; }
        .rm-btn:hover { background: #fecaca; }

        .rbtn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; color: #9ca3af;
          font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .rbtn-on { border-color: #1a3a5c; background: #1a3a5c; color: #fff; }
        .rbtn:hover { border-color: #2c5f8a; }

        .skill-cat { font-size: 12px; font-weight: 700; color: #1a3a5c; padding: 8px 0 6px; border-bottom: 1px solid #e5e7eb; margin-bottom: 2px; }
        .skill-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f3f4f6; }

        .nav-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;
          background: #fff; border-top: 1px solid #e5e7eb; position: sticky; bottom: 0; z-index: 100; }
        .nav-btn { padding: 11px 22px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .nav-prev { background: #f3f4f6; color: #374151; }
        .nav-prev:hover { background: #e5e7eb; }
        .nav-next { background: #1a3a5c; color: #fff; }
        .nav-next:hover { background: #2c5f8a; }

        .export-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 8px; border: none;
          font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
          background: linear-gradient(135deg, #059669, #047857); color: #fff; transition: transform 0.1s; }
        .export-btn:hover { transform: scale(1.02); }
        .export-btn:disabled { opacity: 0.7; cursor: default; transform: none; }

        .pdf-section-heading { font-size: 15px; font-weight: 700; color: #1a3a5c;
          margin: 4px 12px; padding: 10px 0 6px; border-bottom: 2px solid #c9a84c; break-before: page; }
        .pdf-section:first-child .pdf-section-heading { break-before: auto; }
        .card { page-break-inside: avoid; }

        .pdf-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 14px; background: rgba(26,58,92,0.55);
          color: #fff; font-size: 15px; font-weight: 600; }
        .pdf-spinner { width: 38px; height: 38px; border: 4px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%; animation: pdfspin 0.8s linear infinite; }
        @keyframes pdfspin { to { transform: rotate(360deg); } }

        .step-bar { display: flex; overflow-x: auto; gap: 4px; padding: 10px 12px; background: #fff; border-bottom: 1px solid #e5e7eb;
          position: sticky; top: 64px; z-index: 99; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .step-bar::-webkit-scrollbar { display: none; }
        .step-pill { padding: 6px 12px; border-radius: 18px; font-size: 11px; white-space: nowrap; cursor: pointer; transition: all 0.2s;
          border: none; font-family: inherit; }
        .step-on { background: #1a3a5c; color: #fff; font-weight: 600; }
        .step-off { background: #f3f4f6; color: #6b7280; font-weight: 400; }
        .step-off:hover { background: #e5e7eb; }

        @media print {
          .no-print { display: none !important; }
          .card { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; margin: 8px 0; }
          body { background: #fff !important; }
        }

        @media (max-width: 480px) {
          .row2 { grid-template-columns: 1fr; }
          .dtable { font-size: 10px; }
          .dtable thead th { font-size: 9px; padding: 6px 3px; }
          .tdi { padding: 5px 6px; font-size: 11px; }
        }
      `}</style>

      {exporting && (
        <div className="pdf-overlay no-print">
          <div className="pdf-spinner" />
          <div>PDF файл үүсгэж байна...</div>
        </div>
      )}

      <div style={{
        background: "linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%)",
        color: "#fff", padding: "18px 16px 14px", textAlign: "center",
        position: "sticky", top: 0, zIndex: 100,
      }} className="no-print">
        <button
          onClick={handleClearAll}
          title="Шинэ анкет"
          style={{
            position: "absolute", top: 12, right: 12, border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 6, padding: "5px 10px",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
          Цэвэрлэх
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.3px" }}>ТӨРИЙН АЛБАН ХААГЧИЙН АНКЕТ</div>
        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Маягт 1 • ТАЗ 2022.11.14 тогтоол №600</div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>Оруулсан мэдээлэл автоматаар хадгалагдана</div>
        <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#c9a84c", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>

      <div className="step-bar no-print">
        {STEPS.map((s, i) => (
          <button key={i} className={`step-pill ${i === step ? "step-on" : "step-off"}`} onClick={() => setStep(i)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div id="form-content" style={{ paddingBottom: 76, maxWidth: 780, margin: "0 auto" }}>
        {renderBody()}
      </div>

      <div className="nav-bar no-print">
        <button className="nav-btn nav-prev" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ← Өмнөх
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{step + 1} / {STEPS.length}</span>
        {step < STEPS.length - 1 ? (
          <button className="nav-btn nav-next" onClick={() => setStep(step + 1)}>Дараах →</button>
        ) : (
          <button className="export-btn" onClick={handleExport} disabled={exporting}>{exporting ? "..." : "PDF татах"}</button>
        )}
      </div>
    </div>
  );
}
