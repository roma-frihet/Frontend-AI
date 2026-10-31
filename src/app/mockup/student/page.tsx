const history = [
  { no: 1, date: "9월 4일", correct: "7 / 10", delta: "+7", total: 7 },
  { no: 2, date: "9월 11일", correct: "9 / 10", delta: "+9", total: 16 },
  { no: 3, date: "9월 18일", correct: "6 / 10", delta: "+6", total: 22 },
  { no: 4, date: "9월 25일", correct: "10 / 10", delta: "+10", total: 32 },
  { no: 5, date: "10월 2일", correct: "8 / 10", delta: "+8", total: 40 },
  { no: 6, date: "10월 9일", correct: "9 / 10", delta: "+9", total: 49 },
];

export default function StudentPage() {
  const max = history[history.length - 1].total;

  return (
    <main className="wk-container">
      <div className="wk-page-head">
        <h1>내 점수 기록</h1>
        <p className="label">
          <span className="wk-tag wk-tag--accent">2반</span> 예시 학생
        </p>
      </div>

      <div className="wk-stack">
        <div className="wk-kpis">
          <div className="wk-card">
            <p className="label">누적 점수</p>
            <p className="num">49</p>
          </div>
          <div className="wk-card">
            <p className="label">지난 차시</p>
            <p className="num">+9</p>
          </div>
          <div className="wk-card wk-open">
            <h3>7차시 문제가 열렸습니다</h3>
            <a href="#" className="wk-btn wk-btn--primary">문제 풀기</a>
          </div>
        </div>

        <section className="wk-card wk-panel" aria-labelledby="hist-title">
          <header>
            <h3 id="hist-title">차시별 누적 점수</h3>
            <p className="label">점수는 차시마다 쌓입니다</p>
          </header>
          <ol className="wk-bars">
            {history.map((h, i) => (
              <li key={h.no} className={i === history.length - 1 ? "is-now" : ""}>
                <div className="wk-track">
                  <span style={{ blockSize: `${(h.total / max) * 100}%` }} />
                </div>
                {h.no}차시
              </li>
            ))}
          </ol>
          <div className="wk-table-wrap">
            <table className="wk-table">
              <thead>
                <tr>
                  <th scope="col">차시</th>
                  <th scope="col">날짜</th>
                  <th scope="col" className="end">맞힌 문제</th>
                  <th scope="col" className="end">점수 변화</th>
                  <th scope="col" className="end">누적 점수</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h) => (
                  <tr key={h.no}>
                    <td>{h.no}차시</td>
                    <td>{h.date}</td>
                    <td className="end">{h.correct}</td>
                    <td className="end">{h.delta}</td>
                    <td className="end total">{h.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
