import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '../../components/Loader';
import {
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  message,
} from 'antd';
import { NotFoundPage } from '../../components/NotFoundPage';

// Импортируем ваши компоненты вопросов
import { Text_q } from './answer/text-q';
import { Num_q } from './answer/num-q';
import { List_num } from './answer/list-num';
import { Matrix_q } from './answer/matrix-q';
import { List_pars } from './answer/list-pars';
import { List_reber } from './answer/list-reber';
import { Variant_Q } from './answer/variants-q';

export const FormPage = () => {
  const [form] = Form.useForm();
  const { testId } = useParams();
  const [wasOutOfTab, setWasOutOfTab] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0); // Лічильник виходів із вкладки

  const [test, setTest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сохраняем ответы и данные формы в локальном состоянии
  const [formData, setFormData] = useState({
    studentName: '',
    group: '',
    variant: '',
    answers: {},
  });

  // Загрузка данных теста с сервера
  useEffect(() => {
    setIsLoading(true);
    fetch(
      `https://stradanie-production-f14d.up.railway.app/api/tests/${testId}`,
    )
      .then(res => {
        if (!res.ok) {
          throw new Error('Ошибка загрузки теста');
        }

        return res.json();
      })
      .then(data => {
        setTest(data);
        setIsLoading(false);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Ошибка загрузки теста:', error);
        setIsLoading(false);
      });
  }, [testId]);

  // Функция обновления ответа на конкретный вопрос
  const updateAnswer = (questionId, answer) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
    }));
  };

  // Функция рендера нужного типа вопроса
  const renderQuestion = (question, index1) => {
    switch (question.type) {
      case 'text':
        return (
          <Text_q
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'number':
        return (
          <Num_q
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'list-num':
        return (
          <List_num
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'matrix':
        return (
          <Matrix_q
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'variants':
        return (
          <Variant_Q
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'list-pars':
        return (
          <List_pars
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      case 'list-reber':
        return (
          <List_reber
            index1={index1}
            question={question}
            onChange={answer => updateAnswer(question.id, answer)}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    message.warning(
      '⚠️ ПІД ЧАС ПРОХОДЖЕННЯ ТЕСТУ, ВАШІ ДІЇ БУДУТЬ ВІДСЛІДКОВУВАТИСЯ!',
      10,
    );
  }, []);

  useEffect(() => {
    const logAction = action => {
      // eslint-disable-next-line no-console
      console.log(`[LOG] ${action} - ${new Date().toISOString()}`);
    };

    const enterFullScreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAction('⚠️ Студент переключився з вкладки!');
        setWasOutOfTab(true);
        setTabSwitchCount(prevCount => prevCount + 1); // Збільшуємо лічильник виходів
      } else if (wasOutOfTab) {
        message.warning('⚠️ ВАШІ ДІЇ БУЛИ ЗАМІЧЕНІ І ВРАХОВАНІ!');
        logAction('⚠️ Студент повернувся на вкладку!');
      }
    };

    const handleBeforeUnload = event => {
      logAction('🚨 Студент намагався закрити сторінку!');
      event.preventDefault();
      // eslint-disable-next-line no-param-reassign
      event.returnValue = 'Ви впевнені, що хочете покинути тест?';
    };

    const preventExitFullScreen = () => {
      if (!document.fullscreenElement) {
        logAction('🚨 Студент вийшов з повноекранного режиму!');
        alert('⚠️ ВАШІ ДІЇ БУЛИ ЗАМІЧЕНІ І ВРАХОВАНІ!');
        enterFullScreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', preventExitFullScreen);

    enterFullScreen();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', preventExitFullScreen);
    };
  }, [wasOutOfTab]);

  // Основная функция отправки формы (Ant Design вызывает её при onFinish)
  const onFinish = () => {
    if (!test) {
      return;
    }

    // Формируем объект для отправки
    const submissionData = {
      'id-test': test.id,
      'id-answer': Date.now(),
      student: formData.studentName,
      group: formData.group,
      variant: formData.variant,
      dueTime: new Date().toISOString(),
      answers: Object.entries(formData.answers).map(([questionId, answer]) => ({
        'question-id': questionId,
        answer,
      })),
      tabSwitches: tabSwitchCount,
    };

    setIsSubmitting(true);

    fetch('https://stradanie-production-f14d.up.railway.app/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка отправки данных');
        }

        return response.json();
      })
      .then(data => {
        // eslint-disable-next-line no-console
        console.log('Прогресс обновлён и данные сохранены:', data);
        message.success('Відповідь успішно відправлено!');
        window.close(); // Если нужно сразу закрыть окно
        form.resetFields();
        // Сброс локального состояния:
        setFormData({
          studentName: '',
          group: '',
          variant: '',
          answers: {},
        });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Ошибка отправки:', error);
        message.error('Произошла ошибка при отправке!');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Обработка ошибок валидации полей Ant Design
  const onFinishFailed = errorInfo => {
    if (errorInfo.errorFields?.length) {
      const firstErrorField = errorInfo.errorFields[0].name;

      form.scrollToField(firstErrorField, {
        behavior: 'smooth',
        block: 'center',
      });
      setTimeout(() => {
        const fieldInstance = form.getFieldInstance(firstErrorField);

        if (fieldInstance?.focus) {
          fieldInstance.focus();
        }
      }, 600);
    }

    message.error('Будь ласка, виправте помилки у формі!');
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!test) {
    return <NotFoundPage />;
  }

  return (
    <Row justify="center" style={{ padding: 10 }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <h1>Самостійна робота №{test.nomer}</h1>

        <Descriptions
          style={{ marginBottom: 10 }}
          title="Корисна інформація"
          bordered
          column={1}
        >
          <Descriptions.Item label="Тема роботи">
            {test.nazwa}
          </Descriptions.Item>
          {test.additional && (
            <Descriptions.Item label="Коментар">
              {test.additional}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          scrollToFirstError
        >
          <Form.Item
            labelCol={{ span: 9 }}
            label="Ваше прізвище та ім'я"
            name="name"
            rules={[
              {
                required: true,
                message: 'Будь ласка, введіть ваше ПІБ',
              },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const parts = value.trim().split(/\s+/);

                  if (parts.length !== 2) {
                    return Promise.reject(
                      'Введіть тільки прізвище та імʼя (2 слова)',
                    );
                  }

                  const fullName = parts.join(' ');

                  // Дозволено лише українські/латинські літери та пробіли між словами
                  const onlyLettersRegex = /^[А-Яа-яЄєІіЇїҐґA-Za-z\s]+$/;

                  if (!onlyLettersRegex.test(fullName)) {
                    return Promise.reject(
                      'ПІБ може містити тільки літери (без цифр і символів)',
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              onChange={e =>
                setFormData(prev => ({ ...prev, studentName: e.target.value }))
              }
            />
          </Form.Item>

          <Form.Item
            label="Група"
            name="group"
            rules={[
              { required: true, message: 'Введіть назву групи!' },
              {
                pattern: /^[А-ЯA-Z]{2}-\d{3}$/,
                message: 'Формат групи: ББ-ЧЧЧ (наприклад: ПЗ-221)',
              },
            ]}
          >
            <Input
              placeholder="ПЗ-221"
              onChange={e =>
                setFormData(prev => ({ ...prev, group: e.target.value }))
              }
            />
          </Form.Item>

          <Form.Item
            label="Варіант"
            name="variant"
            rules={[{ required: true, message: 'Введіть номер варіанту' }]}
          >
            <InputNumber
              placeholder="1"
              min={1}
              max={test.variantCount || 10} // необов’язково, але краще обмежити
              onChange={value =>
                setFormData(prev => ({ ...prev, variant: value }))
              }
            />
          </Form.Item>

          {/* Генерация вопросов */}
          {test.questions.map((q, index) => renderQuestion(q, index))}

          <Button
            type="primary"
            htmlType="submit"
            style={{ flex: 1, minWidth: 200 }}
            loading={isSubmitting}
          >
            Надіслати
          </Button>
        </Form>
      </Col>
    </Row>
  );
};
