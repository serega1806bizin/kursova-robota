import { Col, Divider, message, Row } from 'antd';
import styles from '../DetailsTask/DetailsTask.module.scss';
import { handleBackButton } from '../../utils/handleBackButton';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '../../components/Loader';
import { ListNum } from './list-num';
import { Matrix } from './matrix-q';
import { Variants_q } from './variants-q';
import { List_pars } from './list-pars';
import { List_reber } from './list-reber';
import { MatrixA } from './matrix-A';

function pairsEqual(pair1, pair2) {
  const [a1, a2] = Array.isArray(pair1) ? pair1 : [pair1.x1, pair1.x2];
  const [b1, b2] = Array.isArray(pair2) ? pair2 : [pair2.x1, pair2.x2];

  return (
    (Number(a1) === Number(b1) && Number(a2) === Number(b2)) ||
    (Number(a1) === Number(b2) && Number(a2) === Number(b1))
  );
}

export const AnswerPage = () => {
  const { answerId, testId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [isObsolete, setIsObsolete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const testRes = await fetch(
          `https://stradanie-production-f14d.up.railway.app/api/tests/${testId}`,
        );
        const testData = await testRes.json();

        const answerRes = await fetch(
          `https://stradanie-production-f14d.up.railway.app/api/answers/answer/${answerId}`,
        );
        const answerData = await answerRes.json();

        // Перевіряємо, чи змінився тест після відповіді
        if (
          testData.lastUpdated &&
          answerData.timestamp &&
          answerData.timestamp > testData.lastUpdated
        ) {
          setIsObsolete(true);
          message.warning(
            'Тест був змінений після проходження. Дані можуть бути некоректні.',
          );
        }

        setTest(testData);
        setAnswer(answerData);
      } catch (error) {
        message.error('Помилка завантаження даних');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [answerId, testId]);

  const getColor = correctness => {
    switch (correctness) {
      case 'full':
        return 'green';
      case 'partial':
        return 'orange';
      default:
        return 'red';
    }
  };

  const computeCorrectness = (question, studentAns) => {
    const correctAns = question.answersByVariant?.[answer.variant]; // ✅ замість question.answer
    if (!correctAns) {
      return 'none';
    }

    let correctness = 'none';

    switch (question.type) {
      case 'text':
        correctness =
          studentAns?.trim().toLowerCase() === correctAns?.trim().toLowerCase()
            ? 'full'
            : 'none';
        break;

      case 'number':
        correctness =
          Number(studentAns) === Number(correctAns) ? 'full' : 'none';
        break;
      case 'list-num': {
        const correctList = correctAns.massiv;

        if (correctAns.consistencyImportant) {
          let count = 0;

          for (let i = 0; i < correctList.length; i++) {
            if (studentAns && studentAns[i] === correctList[i]) {
              count++;
            }
          }

          correctness =
            count === correctList.length
              ? 'full'
              : count > 0
                ? 'partial'
                : 'none';
        } else {
          const correctSet = new Set(correctList);
          const studentSet = new Set(studentAns);
          let count = 0;

          studentSet.forEach(num => {
            if (correctSet.has(num)) {
              count++;
            }
          });
          correctness =
            count === correctSet.size && studentSet.size === correctSet.size
              ? 'full'
              : count > 0
                ? 'partial'
                : 'none';
        }

        break;
      }

      case 'matrix': {
        const studentMatrix = studentAns.answer;
        const correctMatrix = correctAns;
        let total = 0;
        let count = 0;

        for (let i = 0; i < correctMatrix.length; i++) {
          for (let j = 0; j < correctMatrix[i].length; j++) {
            total++;
            if (
              Number(studentMatrix?.[i]?.[j]) === Number(correctMatrix[i][j])
            ) {
              count++;
            }
          }
        }

        correctness = count === total ? 'full' : count > 0 ? 'partial' : 'none';
        break;
      }

      case 'variants': {
        let count = 0;

        for (let i = 0; i < studentAns.length; i++) {
          if (studentAns[i] === correctAns.correct[i]) {
            count++;
          }
        }

        correctness =
          count === studentAns.length ? 'full' : count > 0 ? 'partial' : 'none';
        break;
      }

      case 'list-pars': {
        const correctPairs = correctAns.pairs.map(pair => JSON.stringify(pair));
        const studentPairs = studentAns.answer.map(pair =>
          JSON.stringify(pair),
        );
        const count = studentPairs.filter(pair =>
          correctPairs.includes(pair),
        ).length;

        correctness =
          count === correctPairs.length &&
          studentPairs.length === correctPairs.length
            ? 'full'
            : count > 0
              ? 'partial'
              : 'none';
        break;
      }

      case 'list-reber': {
        let correctCount = 0;

        for (const correctEdge of correctAns) {
          const found = studentAns.answer.some(studentEdge =>
            pairsEqual(correctEdge, studentEdge),
          );

          if (found) {
            correctCount++;
          }
        }

        correctness =
          correctCount === correctAns.length &&
          studentAns.answer.length === correctAns.length
            ? 'full'
            : correctCount > 0
              ? 'partial'
              : 'none';
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.warn(`⚠️ Невідомий тип питання: ${question.type}`);
    }

    return correctness;
  };

  const renderStudentAnswer = (
    question,
    studentAns,
    correctAns,
    correctness,
  ) => {
    switch (question.type) {
      case 'text':
      case 'number':
        return (
          <span style={{ color: getColor(correctness) }}>{studentAns}</span>
        );
      case 'list-num':
        return <ListNum Corr={correctAns} Ans={studentAns} />;
      case 'matrix':
        return <MatrixA Ans={studentAns.answer} Corr={correctAns} />;
      case 'variants':
        return <Variants_q Ans={studentAns} Corr={correctAns} />;
      case 'list-pars':
        return <List_pars pairs={studentAns.answer} />;
      case 'list-reber':
        return <List_reber Corr={correctAns} Ans={studentAns} />;
      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question, correctAns) => {
    switch (question.type) {
      case 'text':
      case 'number':
        return JSON.stringify(correctAns);
      case 'list-num':
        return <ListNum Ans={correctAns.massiv} />;
      case 'matrix':
        return <Matrix Corr={correctAns} />;
      case 'variants':
        return <Variants_q Corr={correctAns} />;
      case 'list-pars':
        return <List_pars pairs={correctAns.pairs} />;
      case 'list-reber':
        return <List_reber Corr={correctAns} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Row justify="center" style={{ padding: 10 }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <div className={styles.productDetails__back}>
          <button
            className={styles.productDetails__backArrow}
            onClick={handleBackButton}
          />
          <button
            className={styles.productDetails__backText}
            onClick={handleBackButton}
          >
            Назад
          </button>
        </div>

        <h1>Результат ✅</h1>
        {isObsolete && (
          <p style={{ color: 'red' }}>
            ⚠️ Увага! Цей тест був змінений після відповіді студента. Дані
            можуть не відповідати структурі тесту.
          </p>
        )}
        <p>
          <strong>Студент:</strong> {answer?.student}
        </p>
        <p>
          <strong>Група:</strong> {answer?.group}
        </p>
        <p>
          <strong>Оцінка:</strong> {answer?.mark}
        </p>
        <p>
          <strong>Скільки разів переключався між вкладками:</strong>{' '}
          {answer.tabSwitches}
        </p>

        <Divider>Детальніше</Divider>

        <div>
          {test?.questions.map(question => {
            const studentAnswer = answer?.answers?.find(
              ans => Number(ans['question-id']) === Number(question.id),
            );

            if (!studentAnswer || !studentAnswer.answer) {
              return (
                <div
                  key={question.id}
                  style={{
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '10px',
                    backgroundColor: '#ffe4e4',
                  }}
                >
                  <p>
                    <strong>Питання:</strong> {question.text}
                  </p>
                  <p style={{ color: 'red' }}>
                    ⚠️ Немає відповіді або структура порушена.
                  </p>
                </div>
              );
            }

            const studentAns = studentAnswer.answer;
            const correctAns = question.answersByVariant?.[answer.variant];
            if (!correctAns) {
              return null;
            } // або відобразити повідомлення про помилку

            const correctness = computeCorrectness(question, studentAns);
            const bgColor =
              correctness === 'full'
                ? '#e6ffed'
                : correctness === 'partial'
                  ? '#ffffcc'
                  : '#ffebeb';

            return (
              <div
                key={question.id}
                style={{
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  backgroundColor: bgColor,
                }}
              >
                <p>
                  <strong>Питання:</strong> {question.text}
                </p>
                <p>
                  <strong>Відповідь студента:</strong>{' '}
                  {renderStudentAnswer(
                    question,
                    studentAns,
                    correctAns,
                    correctness,
                  )}
                </p>
                {correctness !== 'full' && (
                  <p>
                    <strong>Правильна відповідь:</strong>{' '}
                    {renderCorrectAnswer(question, correctAns)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Col>
    </Row>
  );
};
