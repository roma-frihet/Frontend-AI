import Link from "next/link";

const board = [
  { cls: "1반", cells: ["완료", "완료", "열림", "예정"] },
  { cls: "2반", cells: ["완료", "열림", "예정", "예정"] },
  { cls: "3반", cells: ["완료", "완료", "완료", "예정"] },
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
        <div className="wk-card wk-board">
          <div className="wk-board-head">
            <h3>오늘의 문제 현황</h3>
            <p className="label">예시 화면</p>
          </div>
          <table>
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
                <th scope="row">{row.cls}</th>
                {row.cells.map((c, i) => (
                  <td key={i}>
                    <span className={`wk-chip ${c === "열림" ? "wk-chip--open" : c === "완료" ? "wk-chip--done" : ""}`}>{c}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
          <p className="label">반마다 진도가 달라도 차시별 문제는 같습니다.</p>
        </div>
      </section>

      <section className="wk-container wk-section" aria-labelledby="flow-title">
        <div className="wk-head">
          <h2 id="flow-title">출제부터 점수까지</h2>
          <p className="lead">세 단계면 됩니다.</p>
        </div>
        <ol className="wk-steps">
          {steps.map((s) => (
            <li key={s.n} className="wk-card">
              <span className="num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wk-section" style={{ paddingTop: 0 }} aria-labelledby="entry-title">
        <div className="wk-container">
          <h2 id="entry-title" className="visually-hidden">역할 선택</h2>
          <div className="wk-entry">
            <div className="wk-card">
              <h3>교사</h3>
              <p>문제를 내고, 반과 차시를 골라 엽니다.</p>
              <Link href="/mockup/teacher" className="wk-btn wk-btn--primary">문제 출제하기</Link>
            </div>
            <div className="wk-card">
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
