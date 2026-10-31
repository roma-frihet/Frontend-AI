const questions = [
  { no: 1, text: "다음 중 광합성이 일어나는 곳은?", answer: "엽록체" },
  { no: 2, text: "광합성에 필요한 기체는?", answer: "이산화탄소" },
  { no: 3, text: "광합성의 결과로 만들어지는 물질은?", answer: "포도당" },
];

const open = [
  { cls: "1반", tone: "wk-c1", period: "3차시", state: "열림", count: 10 },
  { cls: "2반", tone: "wk-c2", period: "2차시", state: "열림", count: 10 },
  { cls: "3반", tone: "wk-c3", period: "3차시", state: "닫힘", count: 10 },
];

export default function TeacherPage() {
  return (
    <main className="wk-container">
      <div className="wk-page-head">
        <h1>문제 출제</h1>
        <p className="label">문제는 차시별로 만들고, 반마다 열어 줍니다</p>
      </div>

      <div className="wk-stack">
        <div className="wk-split">
          <section className="wk-panel" aria-labelledby="new-title">
            <header>
              <h3 id="new-title">새 문제</h3>
              <p className="label">객관식</p>
            </header>
            <form className="wk-body">
              <label className="wk-field">
                <span>차시</span>
                <select className="wk-select" defaultValue="3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}차시</option>
                  ))}
                </select>
              </label>
              <label className="wk-field">
                <span>문제</span>
                <textarea className="wk-textarea" placeholder="문제를 입력하세요" />
              </label>
              <fieldset className="wk-choices">
                <legend>보기와 정답</legend>
                {[1, 2, 3, 4].map((n) => (
                  <label className="wk-choice" key={n}>
                    <input type="radio" name="answer" defaultChecked={n === 1} aria-label={`${n}번을 정답으로`} />
                    <input className="wk-input" type="text" placeholder={`보기 ${n}`} aria-label={`보기 ${n}`} />
                  </label>
                ))}
              </fieldset>
              <div className="wk-row-end">
                <button type="button" className="wk-btn">임시 저장</button>
                <button type="button" className="wk-btn wk-btn--primary">문제 추가</button>
              </div>
            </form>
          </section>

          <div style={{ display: "grid", gap: "var(--wk-gap)" }}>
            <section className="wk-panel" aria-labelledby="open-title">
              <header>
                <h3 id="open-title">문제 열기</h3>
                <p className="label">수업이 끝난 반에 엽니다</p>
              </header>
              <form className="wk-body">
                <fieldset className="wk-choices">
                  <legend>반</legend>
                  <div className="wk-pick">
                    {[
                      { v: "1", tone: "wk-c1" },
                      { v: "2", tone: "wk-c2" },
                      { v: "3", tone: "wk-c3" },
                    ].map((c, i) => (
                      <label key={c.v} className={c.tone}>
                        <input type="radio" name="cls" defaultChecked={i === 1} aria-label={`${c.v}반`} />
                        <span className="num">{c.v}반</span>
                        <span className="wk-note" style={{ color: "inherit" }}>현재 {[3, 2, 4][i]}차시</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="wk-field">
                  <span>열 차시</span>
                  <select className="wk-select" defaultValue="2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n}차시 (문제 10개)</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="wk-btn wk-btn--primary">2반 2차시 열기</button>
              </form>
            </section>

            <section className="wk-panel" aria-labelledby="status-title">
              <header>
                <h3 id="status-title">열림 현황</h3>
              </header>
              <div className="wk-table-wrap">
                <table className="wk-table">
                  <thead>
                    <tr>
                      <th scope="col">반</th>
                      <th scope="col">차시</th>
                      <th scope="col">상태</th>
                      <th scope="col"><span className="visually-hidden">동작</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {open.map((o) => (
                      <tr key={o.cls}>
                        <td><span className={`wk-tag ${o.tone}`}>{o.cls}</span></td>
                        <td>{o.period}</td>
                        <td className={o.state === "열림" ? "wk-state-open" : ""}>{o.state}</td>
                        <td className="end">
                          <button type="button" className="wk-btn wk-btn--text">{o.state === "열림" ? "닫기" : "열기"}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <section className="wk-panel" aria-labelledby="list-title">
          <header>
            <h3 id="list-title">3차시 문제</h3>
            <p className="label">총 {questions.length}개</p>
          </header>
          <div className="wk-table-wrap">
            <table className="wk-table">
              <thead>
                <tr>
                  <th scope="col">번호</th>
                  <th scope="col">문제</th>
                  <th scope="col">정답</th>
                  <th scope="col"><span className="visually-hidden">동작</span></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.no}>
                    <td className="num">{q.no}</td>
                    <td>{q.text}</td>
                    <td>{q.answer}</td>
                    <td className="end">
                      <button type="button" className="wk-btn wk-btn--text">수정</button>
                    </td>
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
