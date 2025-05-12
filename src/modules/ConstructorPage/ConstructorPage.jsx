import { useState, useCallback } from 'react';
import {
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  message,
  notification,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { TaskItem } from './Task';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { handleBackButton } from '../../utils/handleBackButton';
import styles from '../DetailsTask/DetailsTask.module.scss';

export const ConstructorPage = () => {
  const [form] = Form.useForm();
  const [testName, setTestName] = useState('');
  const [testNumber, setTestNumber] = useState(0);
  const [additionalText, setAdditionalText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [is1Checked, setIs1Checked] = useState(false);
  const [countOfVariants, setCountOfVariants] = useState(1);
  const navigate = useNavigate();

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const API_URL = 'https://stradanie-production-f14d.up.railway.app/api/tests';

  // Уведомление об успехе
  const openSuccessNotification = useCallback(() => {
    notification.success({
      message: 'Успіх!',
      description: 'Тест успішно створений!',
      placement: 'topRight',
      duration: 3,
    });
  }, []);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        points: 0,
        answersByVariant: {},
      },
    ]);
  };

  const handleAnswerChange = useCallback((id, variantNum, value) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? {
              ...q,
              answersByVariant: {
                ...q.answersByVariant,
                [variantNum]: value,
              },
            }
          : q,
      ),
    );
  }, []);

  const removeQuestion = useCallback(id => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  // Обновление количества баллов в вопросе
  const updatePoints = useCallback((id, newPoints) => {
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, points: newPoints } : q)),
    );
  }, []);

  // Добавление теста в БД
  const addTest = async test => {
    try {
      await axios.post(API_URL, test);
      openSuccessNotification();
      navigate('/task');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Помилка при додаванні:', error);
      message.error('Не вдалося створити тест. Перевірте підключення!');
    }
  };

  // Отправка формы
  const onFinish = useCallback(() => {
    const isAllVariantsFilled = questions.every(q =>
      Array.from({ length: countOfVariants }).every((_, i) =>
        q.answersByVariant?.[i + 1]?.toString().trim(),
      ),
    );

    if (!isAllVariantsFilled) {
      message.warning(
        // eslint-disable-next-line max-len
        'Будь ласка, заповніть відповіді для кожного варіанта у кожному питанні',
      );

      return;
    }

    if (questions.length === 0) {
      message.warning('Ви повинні додати хоча б одне питання');

      return;
    }

    const test = {
      type: 'task',
      id: Date.now(),
      nazwa: testName,
      nomer: testNumber,
      totalPoints,
      progress: 0,
      additional: additionalText,
      variantCount: countOfVariants, // ← ДОДАЙ ЦЕ
      questions,
    };

    addTest(test);
  }, [testName, testNumber, totalPoints, additionalText, questions]);

  // Обработка ошибок валидации формы
  const onFinishFailed = useCallback(
    errorInfo => {
      if (errorInfo.errorFields?.length > 0) {
        const firstErrorField = errorInfo.errorFields[0].name;

        form.scrollToField(firstErrorField, {
          behavior: 'smooth',
          block: 'center',
        });
        setTimeout(() => {
          const fieldInstance = form.getFieldInstance(firstErrorField);

          fieldInstance?.focus();
        }, 600);
      }

      message.error('Будь ласка, виправте помилки у формі!');
    },
    [form],
  );

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
        <h1>Створення тесту</h1>
        <Form.Item
          labelCol={{ span: 7 }}
          label="Кількість варіантів:"
          name="variantCount"
          rules={[
            { required: true, message: 'Будь ласка, кількість варіантів' },
            {
              validator: (_, value) => {
                if (value < 0) {
                  return Promise.reject('Помилочка)');
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            value={countOfVariants}
            min={1}
            max={5}
            onChange={value => {
              if (value < 0) {
                // Ігноруємо або додатково можна встановити повідомлення вручну
                return;
              } else {
                setCountOfVariants(value);
              }
            }}
          />
        </Form.Item>
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          style={{ maxWidth: 600 }}
          onFinishFailed={onFinishFailed}
          scrollToFirstError
        >
          <Divider>Загальна інформація про роботу</Divider>
          <Form.Item
            label="Тема роботи:"
            name="Tema"
            labelCol={{ span: 4.6 }}
            rules={[{ required: true, message: 'Будь-ласка введіть тему' }]}
          >
            <Input onChange={e => setTestName(e.target.value)} />
          </Form.Item>
          <Form.Item
            labelCol={{ span: 3 }}
            label="Номер:"
            name="Nomer"
            rules={[
              { required: true, message: 'Будь ласка, введіть номер роботи' },
              {
                validator: (_, value) => {
                  if (value < 0) {
                    return Promise.reject('Номер не може бути відʼємним');
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              value={testNumber}
              min={1}
              onChange={value => {
                if (value < 0) {
                  // Ігноруємо або додатково можна встановити повідомлення вручну
                  return;
                } else {
                  setTestNumber(value);
                }
              }}
            />
          </Form.Item>

          <Form.Item name="checkbox1" valuePropName="checked">
            <Checkbox onChange={e => setIs1Checked(e.target.checked)}>
              Додати коментар для студентів
            </Checkbox>
          </Form.Item>
          {is1Checked && (
            <Form.Item
              label="Введіть текст:"
              name="коментар"
              labelCol={{ span: 5 }}
              rules={[
                {
                  required: true,
                  message: 'Введіть коментар, або приберіть галочку вище!',
                },
                {
                  min: 10,
                  message: 'Коментар повинен бути не менше 10 символів!',
                },
              ]}
            >
              <TextArea onChange={e => setAdditionalText(e.target.value)} />
            </Form.Item>
          )}
          <Divider>Тепер створюємо питання</Divider>
          {questions.map((question, index) => (
            <TaskItem
              answersByVariant={question.answersByVariant}
              countOfVariants={countOfVariants}
              onAnswerChange={handleAnswerChange}
              index={index}
              key={question.id}
              id={question.id}
              points={question.points}
              onDelete={() => removeQuestion(question.id)}
              onPointsChange={points => updatePoints(question.id, points)}
              onUpdate={(id, updatedData) => {
                setQuestions(prev =>
                  prev.map(q => (q.id === id ? { ...q, ...updatedData } : q)),
                );
              }}
            />
          ))}
          <Divider />
          <p>Загальна кількість балів: {totalPoints}</p>
          <Space
            style={{ width: '100%', marginTop: 10, marginBottom: 10 }}
            wrap
            align="center"
            size="middle"
          >
            <Button
              type="dashed"
              style={{ flex: 1, minWidth: 200, borderColor: 'green' }}
              onClick={addQuestion}
            >
              Додати питання
            </Button>
            <Button
              disabled={questions.length === 0}
              type="primary"
              htmlType="submit"
              style={{ flex: 1, minWidth: 200 }}
            >
              Створити тест
            </Button>
          </Space>
        </Form>
      </Col>
    </Row>
  );
};
