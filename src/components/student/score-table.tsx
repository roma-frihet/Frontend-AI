// 차시별 내 정답 수와 반 평균.
//
// 미응시는 0점이 아니다. 서버가 correctCount를 null로 구분해 주므로 그대로 구분해 보여 준다.

import type { StudentReportResponseScore } from "@/api/generated/model";

export function ScoreTable({ scores }: { scores: StudentReportResponseScore[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-border text-sm text-muted-foreground">
          <th scope="col" className="py-2 font-medium">차시</th>
          <th scope="col" className="py-2 text-right font-medium">내 정답</th>
          <th scope="col" className="py-2 text-right font-medium">반 평균</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score) => (
          <tr key={score.lessonNumber} className="border-b border-border last:border-0">
            <td className="py-2.5">{score.lessonNumber}차시</td>
            <td className="py-2.5 text-right font-bold tabular-nums">
              {score.correctCount == null
                ? "미응시"
                : `${score.correctCount} / ${score.questionCount}`}
            </td>
            <td className="py-2.5 text-right tabular-nums text-accent-deep">
              {score.classAverageCorrect == null
                ? "–"
                : score.classAverageCorrect.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
