import { SKILLS_LEFT, SKILLS_RIGHT, COMM_CATS, OFFICE_APPS } from "./skills.js";

// Renders the questionnaire in the layout of the official state template
// (Маягт 1 — ТАЗ 2022.11.14 тогтоол №600), filled with the user's data.
// This is what gets captured when exporting to PDF.

const REG_CELLS = 10;

function Boxes({ value = "", count = REG_CELLS }) {
  const chars = String(value || "").slice(0, count).split("");
  return (
    <span className="of-boxes">
      {[...Array(count)].map((_, i) => (
        <span key={i} className="of-box">{chars[i] || ""}</span>
      ))}
    </span>
  );
}

// A labelled fill-in field with a dotted leader line showing the value.
function Fill({ label, value, grow = 1, tail }) {
  return (
    <>
      {label ? <span className="of-lbl">{label}</span> : null}
      <span className="of-fill" style={{ flex: grow }}>{value || ""}</span>
      {tail ? <span className="of-lbl">{tail}</span> : null}
    </>
  );
}

function Check({ on }) {
  return <span className="of-check">{on ? "+" : ""}</span>;
}

// Generic bordered table. `columns[0]` is treated as the д/д index column.
function OTable({ columns, rows = [], minRows = 3 }) {
  const total = Math.max(rows.length, minRows);
  return (
    <table className="of-table">
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(total)].map((_, i) => {
          const row = rows[i];
          return (
            <tr key={i}>
              <td className="of-center">{i + 1}</td>
              {columns.slice(1).map((c, ci) => (
                <td key={ci}>{row ? (row[c.key] || "") : ""}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Rate({ v }) {
  return (
    <span className="of-rate">
      {[1, 2, 3].map(n => (
        <span key={n} className={Number(v) === n ? "on" : ""}>{n}</span>
      ))}
    </span>
  );
}

function SkillSide({ groups, state, prefix }) {
  return (
    <table className="of-table of-skill">
      <thead>
        <tr>
          <th colSpan={2}>Хувь хүний ур чадвар</th>
          <th style={{ width: 58 }}>Түвшин</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(g => (
          g.items.map((item, ii) => (
            <tr key={g.cat + ii}>
              {ii === 0 && <td rowSpan={g.items.length} className="of-cat">{g.cat}</td>}
              <td>{item}</td>
              <td className="of-center"><Rate v={state[`${prefix}${g.cat}_${ii}`]} /></td>
            </tr>
          ))
        ))}
      </tbody>
    </table>
  );
}

export default function OfficialForm({ data }) {
  const p = data.personal || {};
  const b = data.sectionB || {};

  return (
    <div className="official">
      <style>{`
        .official { width: 100%; max-width: 780px; margin: 0 auto; background: #fff; color: #000;
          font-family: 'Times New Roman', 'Noto Serif', Georgia, serif; font-size: 12px; line-height: 1.5;
          padding: 22px 26px; }
        .official * { box-sizing: border-box; }

        .of-topright { text-align: right; font-size: 12px; line-height: 1.4; }
        .of-form-no { text-align: right; font-weight: 700; margin: 4px 0 12px; }
        .of-title { text-align: center; font-weight: 700; font-size: 14px; margin: 6px 0; }
        .of-sec { font-weight: 700; margin: 14px 0 6px; }
        .of-sub { font-weight: 700; margin: 12px 0 4px; }
        .of-note { font-size: 11px; margin: 2px 0 6px; }

        .of-line { display: flex; align-items: flex-end; gap: 4px; margin: 3px 0; flex-wrap: wrap; }
        .of-lbl { white-space: nowrap; }
        .of-fill { flex: 1; min-width: 40px; border-bottom: 1px dotted #000; padding: 0 4px; min-height: 15px;
          white-space: pre-wrap; }

        .of-boxes { display: inline-flex; }
        .of-box { width: 20px; height: 22px; border: 1px solid #000; border-left: none; text-align: center;
          line-height: 22px; font-size: 13px; }
        .of-box:first-child { border-left: 1px solid #000; }

        .of-photo { float: right; width: 108px; height: 132px; border: 1px solid #000; display: flex;
          align-items: center; justify-content: center; text-align: center; font-size: 11px; margin-left: 12px; }

        .of-check { display: inline-block; width: 20px; height: 20px; border: 1px solid #000; text-align: center;
          line-height: 20px; font-weight: 700; margin: 0 6px; vertical-align: middle; }

        .of-table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; font-size: 11px; }
        .of-table th, .of-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
        .of-table th { text-align: center; font-weight: 700; }
        .of-center { text-align: center; }
        .of-cat { font-weight: 700; vertical-align: middle; width: 130px; }
        .of-skill td, .of-skill th { font-size: 11px; }
        .of-rate span { display: inline-block; width: 16px; text-align: center; }
        .of-rate span.on { border: 1px solid #000; border-radius: 50%; font-weight: 700; }

        .of-two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
        .of-eq { width: 100%; border-collapse: collapse; font-size: 11px; }
        .of-eq td { border: 1px solid #000; padding: 3px 5px; }

        .of-sign { display: flex; justify-content: space-between; text-align: center; margin-top: 24px; gap: 12px; }
        .of-sign > div { flex: 1; }
        .of-sign .of-fill { display: block; min-height: 26px; border-bottom: 1px solid #000; }

        .of-page-break { break-before: page; page-break-before: always; }
        .of-table tr { page-break-inside: avoid; }
      `}</style>

      {/* ===== SECTION А ===== */}
      <div className="of-topright">
        Төрийн албаны зөвлөлийн 2022 оны 11 дүгээр<br />
        сарын 14-ний өдрийн 600 дугаар тогтоолын<br />
        хоёрдугаар хавсралт
      </div>
      <div className="of-form-no">Маягт 1</div>

      <div className="of-title">ТӨРИЙН АЛБАН ХААГЧИЙН АНКЕТ "А" ХЭСЭГ</div>
      <div className="of-sec">Нэг.Хувь хүний талаарх мэдээлэл</div>

      <div className="of-photo">Цээж зураг<br />3x4 см</div>

      <div className="of-line">
        <span className="of-lbl">Регистрийн дугаар:</span>
        <Boxes value={p.regNo} />
      </div>
      <div className="of-line"><Fill label="1.1.Иргэншил:" value={p.citizenship} /></div>
      <div className="of-line"><Fill label="1.2.Ургийн овог:" value={p.familyName} /></div>
      <div className="of-line"><Fill label="1.3.Эцэг ( эх)-ийн нэр:" value={p.fatherName} /></div>
      <div className="of-line"><Fill label="1.4.Өөрийн нэр:" value={p.firstName} /></div>
      <div className="of-line"><Fill label="1.5.Хүйс:" value={p.gender} /></div>
      <div className="of-line">
        <span className="of-lbl">1.6.Төрсөн:</span>
        <span className="of-fill" style={{ maxWidth: 90 }}>{p.birthYear || ""}</span>
        <span className="of-lbl">он</span>
        <span className="of-fill" style={{ maxWidth: 70 }}>{p.birthMonth || ""}</span>
        <span className="of-lbl">сар</span>
        <span className="of-fill" style={{ maxWidth: 70 }}>{p.birthDay || ""}</span>
        <span className="of-lbl">өдөр</span>
      </div>
      <div className="of-line"><Fill label="1.7. Үндэс, угсаа:" value={p.ethnicity} /></div>
      <div className="of-line">
        <Fill label="1.8.Төрсөн аймаг, хот:" value={p.birthAimag} />
        <Fill label="сум, дүүрэг:" value={p.birthSum} />
      </div>
      <div className="of-line"><Fill label="төрсөн газар:" value={p.birthPlace} /></div>
      <div className="of-line">
        <Fill label="1.9.Байнгын оршин суугаа хаяг:" value={p.permAimag} tail="аймаг, хот" />
      </div>
      <div className="of-line">
        <Fill value={p.permSum} tail="сум, дүүрэг," />
        <Fill value={p.permBag} tail="баг, хороо" />
        <Fill value={p.permKhoroo} tail="хороолол," />
        <Fill value={p.permBair} tail="байр, гудамж," />
        <Fill value={p.permToot} tail="тоот" />
      </div>
      <div className="of-line">
        <Fill label="1.9.1.Түр оршин суугаа хаяг:" value={p.tempAimag} tail="аймаг, хот" />
      </div>
      <div className="of-line">
        <Fill value={p.tempSum} tail="сум, дүүрэг," />
        <Fill value={p.tempBag} tail="баг, хороо" />
        <Fill value={p.tempKhoroo} tail="хороолол, хотхон" />
        <Fill value={p.tempBair} tail="байр, гудамж," />
        <Fill value={p.tempToot} tail="тоот" />
      </div>
      <div className="of-line">
        <Fill label="1.10.Суурин болон гар утасны дугаар:" value={p.phone} />
        <Fill value={p.mobile} />
        <Fill label="цахим шуудангийн хаяг:" value={p.email} />
      </div>
      <div className="of-line">
        <Fill label="1.11.Зайлшгүй шаардлага гарсан үед харилцах хүн (хэн болох)-ий нэр" value={p.emergencyName} />
        <Fill label="утас:" value={p.emergencyPhone} />
      </div>

      <div className="of-sub">1.12.1. Гэрлэлтийн байдал. Хүснэгтэд "+" гэж тэмдэглэнэ</div>
      <div style={{ margin: "4px 0" }}>
        <span className="of-lbl">Гэрлэсэн</span><Check on={p.maritalStatus === "Гэрлэсэн"} />
        <span style={{ display: "inline-block", width: 24 }} />
        <span className="of-lbl">Гэрлээгүй</span><Check on={p.maritalStatus === "Гэрлээгүй"} />
      </div>

      <div className="of-sub">1.12.2.Гэр бүлийн байдал (зөвхөн гэр бүлийн бүртгэлд байгаа хүмүүсийг бичнэ)</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "relation", label: "Таны юу болох" },
          { key: "name", label: "Гэр бүлийн гишүүний эцэг /эх/-ийн болон өөрийн нэр" },
          { key: "regNo", label: "Регистрийн дугаар" },
          { key: "birthPlace", label: "Төрсөн аймаг, хот, сум, дүүрэг" },
          { key: "job", label: "Одоо эрхэлж буй ажил" },
        ]}
        rows={data.familyRows}
      />

      <div className="of-sub">1.13.Садан төрлийн байдал (таны эцэг, эх, төрсөн ах, эгч, дүү, өрх тусгаарласан хүүхдийг оруулан бичнэ)</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "relation", label: "Таны юу болох" },
          { key: "name", label: "Садан төрлийн хүний эцэг /эх/-ийн болон өөрийн нэр" },
          { key: "birthYear", label: "Төрсөн он" },
          { key: "birthPlace", label: "Төрсөн аймаг, хот, сум, дүүрэг" },
          { key: "job", label: "Одоо эрхэлж буй ажил" },
        ]}
        rows={data.relativeRows}
      />

      {/* ===== SECTION 2 EDUCATION ===== */}
      <div className="of-sec">Хоёр.Боловсролын талаарх мэдээлэл</div>
      <div className="of-note">2.1.Боловсрол (суурь, бүрэн дунд, мэргэжлийн, дипломын дээд боловсрол, бакалавр, магистрын зэргийг оруулна)</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "school", label: "Суралцсан улс, сургуулийн нэр" },
          { key: "enrolled", label: "Элссэн, төгссөн он, сар" },
          { key: "major", label: "Эзэмшсэн мэргэжил" },
          { key: "diploma", label: "Гэрчилгээ, дипломын дугаар" },
        ]}
        rows={data.eduRows}
      />
      <div className="of-note">(Сургууль, мэргэжлийн нэрийг бүтэн бичнэ)</div>
      <div style={{ margin: "4px 0" }}>
        <span className="of-lbl">2.1.1.Боловсролгүй бол хүснэгтэд "+"</span><Check on={data.noEducation} /><span className="of-lbl">тэмдэглэнэ.</span>
      </div>

      <div className="of-sub">2.2.Тэтгэлэгт хамрагдсан байдал.</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "school", label: "Тэтгэлэгт хамрагдсан улс, сургуулийн нэр" },
          { key: "enrolled", label: "Элссэн, төгссөн он, сар" },
          { key: "major", label: "Эзэмшсэн мэргэжил" },
          { key: "diploma", label: "Гэрчилгээ, дипломын дугаар" },
        ]}
        rows={data.scholarshipRows}
      />

      <div className="of-sub">2.3.Боловсролын болон шинжлэх ухааны докторын зэрэг</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "type", label: "Докторын зэргийн төрөл" },
          { key: "place", label: "Хамгаалсан газар" },
          { key: "date", label: "Он, сар" },
          { key: "diploma", label: "Гэрчилгээ, дипломын дугаар" },
        ]}
        rows={data.doctoralRows}
      />
      <div className="of-line"><Fill label="Боловсролын доктор (Ph.D)-ын зэрэг хамгаалсан сэдэв:" value={data.phdTopic} /></div>
      <div className="of-line"><Fill label="Шинжлэх ухааны доктор (Sc.D)-ын зэрэг хамгаалсан сэдэв:" value={data.scdTopic} /></div>

      {/* ===== SECTION 3 SKILLS ===== */}
      <div className="of-sec">Гурав.Хувь хүний ур чадвар</div>
      <div className="of-note">3.1.Хувь хүн харилцааны ур чадварынхаа түвшнийг 1-3 оноо (1-бага, 2-дунд, 3-сайн)-оор үнэлнэ</div>
      <div className="of-two">
        <SkillSide groups={SKILLS_LEFT} state={data.skills} prefix="S_" />
        <SkillSide groups={SKILLS_RIGHT} state={data.skills} prefix="S_" />
      </div>
      <div className="of-sub">5.Харилцааны ур чадвар</div>
      <div className="of-two">
        <SkillSide groups={COMM_CATS} state={data.commSkills} prefix="C_" />
        <table className="of-table of-skill">
          <thead>
            <tr><th colSpan={2}>Дээр дурдсанаас бусад ур чадвараас заримыг нэрлэнэ үү.</th><th style={{ width: 58 }}>Түвшин</th></tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i}><td style={{ width: 130 }}>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="of-note">(Хувь хүний харилцааны ур чадварын холбогдох түвшнийг дугуйлна)</div>

      {/* ===== SECTION 3.3 LANGUAGES ===== */}
      <div className="of-sub">3.3.Гадаад хэлний мэдлэг (түвшнийг "+" гэж тэмдэглэнэ.)</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "lang", label: "Гадаад хэлний нэр" },
          { key: "listen", label: "Сонсож ойлгох" },
          { key: "speak", label: "Ярих" },
          { key: "read", label: "Унших" },
          { key: "write", label: "Бичих" },
        ]}
        rows={data.langRows}
      />
      <div className="of-note">Түвшин: Анхан шат / Дунд шат / Ахисан шат</div>
      <div className="of-line"><Fill label="Гадаад хэлний түвшний шалгалтын оноо (TOEFL, IELTS г.м):" value={data.langExams} /></div>

      {/* ===== SECTION 3.4 COMPUTER SKILLS ===== */}
      <div className="of-sub">3.4.Компьютер, техник хэрэглээний ур чадвар (түвшнийг "+" гэж тэмдэглэнэ)</div>
      <div className="of-two">
        <table className="of-table">
          <thead>
            <tr><th rowSpan={2}>Оффисын хэрэглээний программын нэр</th><th colSpan={3}>Түвшин</th></tr>
            <tr><th>Дунд</th><th>Сайн</th><th>Ахисан болон түүнээс дээш</th></tr>
          </thead>
          <tbody>
            {OFFICE_APPS.map(app => (
              <tr key={app}>
                <td>{app}</td>
                {["Дунд", "Сайн", "Ахисан"].map(lvl => (
                  <td key={lvl} className="of-center">{(data.officeSkills || {})[app] === lvl ? "+" : ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <table className="of-table">
            <thead>
              <tr><th>Компьютер, оффисын тоног төхөөрөмж ашиглах</th><th>Дунд</th><th>Сайн</th><th>Ахисан+</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Интернэтийн орчинд ажиллах</td>
                {["Дунд", "Сайн", "Ахисан"].map(lvl => (
                  <td key={lvl} className="of-center">{(data.techSkills || {}).internet === lvl ? "+" : ""}</td>
                ))}
              </tr>
              <tr>
                <td>Дотоод сүлжээ ашиглах</td>
                {["Дунд", "Сайн", "Ахисан"].map(lvl => (
                  <td key={lvl} className="of-center">{(data.techSkills || {}).intranet === lvl ? "+" : ""}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>Оффисын тоног төхөөрөмж ашиглах:</div>
          <table className="of-eq">
            <tbody>
              {[
                { key: "scanner", label: "Сканер" }, { key: "printer", label: "Принтер" },
                { key: "copier", label: "Хувилагч" }, { key: "fax", label: "Факс" },
                { key: "photo", label: "Гэрэл зураг" }, { key: "video", label: "Видео" },
                { key: "recorder", label: "Бичлэгийн аппарат" },
              ].map(d => (
                <tr key={d.key}>
                  <td>{d.label}</td>
                  <td className="of-center" style={{ width: 34 }}>{(data.techSkills || {})[d.key] ? "+" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SECTION 4 WORK ===== */}
      <div className="of-sec">Дөрөв.Ажил эрхлэлт, ажлын туршлага</div>
      <div className="of-note">4.1.Ажил эрхлэлт (ажил эрхлэлтийн мэдээллийг он цагийн дарааллаар бичнэ)</div>
      <table className="of-table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: 30 }}>Д/д</th>
            <th rowSpan={2}>Байгууллагын нэр</th>
            <th rowSpan={2}>Газар, нэгж, хэлтсийн нэр</th>
            <th rowSpan={2}>Албан тушаал</th>
            <th colSpan={2}>Ажилд орсон</th>
            <th colSpan={2}>Ажлаас гарсан</th>
            <th rowSpan={2}>Тайлбар</th>
          </tr>
          <tr>
            <th>огноо</th><th>Шийдвэрийн дугаар</th>
            <th>огноо</th><th>Шийдвэрийн дугаар</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(Math.max((data.workRows || []).length, 3))].map((_, i) => {
            const r = (data.workRows || [])[i];
            return (
              <tr key={i}>
                <td className="of-center">{i + 1}</td>
                <td>{r ? r.org : ""}</td>
                <td>{r ? r.dept : ""}</td>
                <td>{r ? r.position : ""}</td>
                <td>{r ? r.startDate : ""}</td>
                <td></td>
                <td>{r ? r.endDate : ""}</td>
                <td></td>
                <td>{r ? r.note : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="of-note">(Байгууллага, нэгж, албан тушаалын нэрийг бүтнээр бичнэ. Тайлбар хэсэгт ажлаас гарсан үндэслэл шалтгааныг товч бичнэ.)</div>

      <div className="of-sub">4.2.Албан тушаалын зэрэг дэв, цол, мэргэшлийн зэрэг:</div>
      <OTable
        columns={[
          { label: "Д/д", width: 30 },
          { key: "category", label: "Албан тушаалын ангилал, зэрэглэл" },
          { key: "rank", label: "Зэрэг дэв, цолны нэр" },
          { key: "date", label: "Шийдвэрийн огноо, дугаар" },
          { key: "idNo", label: "Үнэмлэхийн дугаар" },
        ]}
        rows={data.rankRows}
      />

      <div className="of-sub">5.Цэргийн алба хаасан эсэх талаарх мэдээлэл</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "idNo", label: "Цэргийн үүрэгтний үнэмлэхийн дугаар" },
          { key: "status", label: "Цэргийн алба хаасан байдал" },
          { key: "note", label: "Тайлбар" },
        ]}
        rows={data.militaryRows}
        minRows={1}
      />
      <div className="of-note">(Цэргийн алба хаасан бол цэргийн цол, цол олгосон шийдвэр, холбогдох бусад мэдээллийг бичиж цэргийн үүрэгтний үнэмлэхийн хуулбарыг хавсаргана.)</div>

      <div style={{ margin: "14px 0 6px" }}>
        <Check on={b.consent} />
        <span>Төрийн байгууллагуудын мэдээллийн санд байгаа өөрийн цахим мэдээллийг албан хэрэгцээнд зориулан төрийн байгууллагуудын мэдээллийн систем хооронд дамжуулан ашиглахыг зөвшөөрч байна.</span>
      </div>
      <div style={{ marginTop: 10 }}>Анкетаа үнэн бичсэн:</div>
      <div className="of-sign">
        <div><span className="of-fill">{b.signFather || ""}</span>/Эцэг (эх)-ийн нэр/</div>
        <div><span className="of-fill">{b.signFirst || ""}</span>/өөрийн нэр/</div>
        <div><span className="of-fill">&nbsp;</span>/Гарын үсэг/</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <span className="of-fill" style={{ display: "inline-block", minWidth: 200 }}>{b.signDate || ""}</span> он, сар, өдөр
      </div>

      {/* ===== SECTION Б ===== */}
      <div className="of-page-break" />
      <div className="of-title">ТӨРИЙН АЛБАН ХААГЧИЙН АНКЕТ "Б" ХЭСЭГ</div>
      <div className="of-line" style={{ marginTop: 10 }}>
        <Fill label="Албан хаагчийн эцэг(эх)-ийн нэр" value={b.parentName} />
        <Fill label="өөрийн нэр" value={b.firstName} />
      </div>

      <div className="of-sub">1.Төрийн албаны ерөнхий болон тусгай шалгалт өгсөн талаарх мэдээлэл</div>
      <table className="of-table">
        <thead>
          <tr><th style={{ width: 30 }}>д/д</th><th>Шалгалтын төрөл</th><th style={{ width: 90 }}>Тийм/үгүй</th><th style={{ width: 160 }}>Тайлбар</th></tr>
        </thead>
        <tbody>
          {(data.examRows || []).map((r, i) => (
            <tr key={i}>
              <td className="of-center">{i + 1}</td>
              <td>{r.type}</td>
              <td className="of-center">{r.yesNo}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="of-note">(Төрийн албаны ерөнхий болон тусгай шалгалтын мэдээллийг тайлбар хэсэгт оруулна).</div>

      <div className="of-sub">2.Сэтгэцийн эрүүл мэндийн талаарх мэдээлэл</div>
      <table className="of-table">
        <tbody>
          <tr>
            <td style={{ width: "28%" }}>Сэтгэцийн эмгэгтэй эсэх</td>
            <td>
              <div>Тийм <Check on={b.mentalYes} /> {b.mentalDetails || ""}</div>
              <div>(энэ талаар тодорхой бичнэ)</div>
              <div>үгүй <Check on={b.mentalNo} /></div>
            </td>
            <td style={{ width: "34%" }}>
              Сэтгэцийн эмгэгтэй эсэх талаар тодорхойлолт гаргасан байгууллагын нэр
              <div className="of-fill" style={{ minHeight: 18 }}>{b.mentalOrg || ""}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="of-note">("Тийм" эсвэл "үгүй" гэснийг дугуйлна.Төрийн жинхэнэ албан тушаалд томилогдоход сэтгэцийн эрүүл мэндийн дүгнэлтийг хавсаргана.)</div>

      <div className="of-sub">3.Эрүүгийн хуульд заасан авлига, албан тушаалын гэмт хэрэг үйлдсэн эсэх талаар мэдээлэл</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "court", label: "Шүүхийн нэр" },
          { key: "article", label: "Эрүүгийн хуульд заасан зүйл, анги" },
          { key: "decision", label: "Шүүхийн шийтгэх тогтоолын огноо, дугаар" },
          { key: "reason", label: "Үндэслэл" },
        ]}
        rows={data.crimeRows}
      />
      <div className="of-note">(төрийн жинхэнэ албан тушаалд томилогдоход ял шийтгэлийн лавлагаа хавсаргана)</div>

      <div className="of-sub">4.Сахилгын шийтгэлийн талаарх мэдээлэл</div>
      <div className="of-note">4.1.Төрийн албаны тухай хуулийн 48 дугаар зүйлийн 48.1, Хөдөлмөрийн тухай хуулийн 123 дугаар зүйлийн 123.2 дахь хэсэгт заасан сахилгын шийтгэлийн төрөл, төрийн албан хаагчийн ёс зүйн хэм хэмжээг зөрчсөний улмаас ногдуулсан ёс зүйн хариуцлагын талаар бичнэ.</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "org", label: "Байгууллагын нэр" },
          { key: "penalty", label: "Шийтгэл ногдуулсан албан тушаалтан" },
          { key: "decision", label: "Шийдвэрийн нэр, огноо, дугаар" },
          { key: "reason", label: "Шийтгэл ногдуулах үндэслэл" },
        ]}
        rows={data.disciplineRows}
      />
      <div className="of-note">(Төрийн албаны тухай хуулийн 48 дугаар зүйлийн 48.6-д заасныг үндэслэн сахилгын шийтгэлгүйд тооцсон тухай энэ хэсэгт бичиж болно).</div>

      <div className="of-sub">5.Мэргэшүүлэх сургалтад хамрагдсан талаарх мэдээлэл</div>
      <div className="of-note">(Мэргэшүүлэх багц сургалт болон мэргэжлийн нарийн мэргэшүүлэх бусад сургалтад хамрагдсан байдлыг бичнэ)</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "place", label: "Хаана, ямар байгууллагад" },
          { key: "dates", label: "Эхэлсэн дууссан он, сар, өдөр" },
          { key: "field", label: "Ямар чиглэлээр" },
          { key: "degree", label: "Эзэмшсэн зэрэг" },
          { key: "certNo", label: "Үнэмлэх, гэрчилгээний дугаар, он, сар, өдөр" },
        ]}
        rows={data.trainingRows}
      />

      <div className="of-sub">6.Шагналын талаарх мэдээлэл</div>
      <div className="of-note">1.1 Төрийн дээд шагнал, Засгийн газрын шагнал болон салбарын бусад шагналыг бичнэ</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "name", label: "Шагналын нэр" },
          { key: "date", label: "Шагнагдсан огноо" },
          { key: "decision", label: "Шийдвэрийн нэр, огноо, дугаар" },
          { key: "reason", label: "Шагнуулсан үндэслэл" },
        ]}
        rows={data.awardRows}
      />

      <div className="of-sub">7.Нөхөх төлбөр, тусламж, дэмжлэг</div>
      <OTable
        columns={[
          { label: "д/д", width: 30 },
          { key: "name", label: "Нөхөх төлбөр, тусламж, дэмжлэгийн нэр, мөнгөн дүн (мян.төг)" },
          { key: "date", label: "Нөхөх төлбөр, тусламж, дэмжлэг олгосон огноо" },
          { key: "decision", label: "Шийдвэрийн нэр, огноо, дугаар" },
          { key: "reason", label: "Олгосон үндэслэл" },
        ]}
        rows={data.compensationRows}
      />
    </div>
  );
}
