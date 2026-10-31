import Link from "next/link";

const board = [
  { cls: "1반", tone: "wk-c1", cells: ["완료", "완료", "열림", "예정"] },
  { cls: "2반", tone: "wk-c2", cells: ["완료", "열림", "예정", "예정"] },
  { cls: "3반", tone: "wk-c3", cells: ["완료", "완료", "완료", "예정"] },
];

const steps = [
  { n: "1", title: "문제를 만든다", body: "차시마다 문제 세트를 출제합니다." },
  { n: "2", title: "반과 차시를 골라 연다", body: "수업이 끝날 때 해당 반에만 엽니다." },
  { n: "3", title: "풀고, 점수가 쌓인다", body: "학생의 기록이 차시마다 남습니다." },
];

export default function MockupHome() {
  return (
    <main>
      <section className="wk-container wk-hero" aria-labelledby="hero-title">
        <div className="wk-hero-copy">
          <h1 id="hero-title">수업이 끝나면 문제가 열립니다</h1>
          <p className="lead">교사가 반과 차시를 골라 열면, 학생이 풀고 점수가 쌓입니다.</p>
          <div className="wk-actions">
            <Link href="/mockup/teacher" className="wk-btn wk-btn--primary">교사로 시작</Link>
            <Link href="/mockup/student" className="wk-btn">학생으로 시작</Link>
          </div>
        </div>
        <table className="wk-board">
          <caption>예시: 반마다 진도가 달라도 차시별 문제는 같습니다.</caption>
          <thead>
            <tr>
              <th scope="col">반</th>
              {[1, 2, 3, 4].map((t) => (
                <th scope="col" key={t}>{t}차시</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.map((row) => (
              <tr key={row.cls}>
                <th scope="row">
                  <span className={`wk-tag ${row.tone}`}>{row.cls}</span>
                </th>
                {row.cells.map((c, i) => (
                  <td key={i} className={c === "열림" ? "is-open" : c === "완료" ? "is-done" : ""}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="wk-container wk-section" aria-labelledby="flow-title">
        <div className="wk-head">
          <h2 id="flow-title">출제부터 점수까지</h2>
          <p className="lead">세 단계면 됩니다.</p>
        </div>
        <ol className="wk-cells" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {steps.map((s) => (
            <li key={s.n}>
              <span className="num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wk-band wk-section" aria-labelledby="entry-title">
        <div className="wk-container">
          <h2 id="entry-title" className="visually-hidden">역할 선택</h2>
          <div className="wk-entry">
            <div>
              <h3>교사</h3>
              <p>문제를 내고, 반과 차시를 골라 엽니다.</p>
              <Link href="/mockup/teacher" className="wk-btn wk-btn--primary">문제 출제하기</Link>
            </div>
            <div>
              <h3>학생</h3>
              <p>열린 문제를 풀고, 내 점수 기록을 봅니다.</p>
              <Link href="/mockup/student" className="wk-btn wk-btn--primary">내 기록 보기</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
