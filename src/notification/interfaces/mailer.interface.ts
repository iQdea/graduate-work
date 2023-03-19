export interface MailerParams {
  recipients: string[]; // Массив получателей
  title: string; // Заголовок письма
  data: Record<string, any>; // Данные, которые будут переданы для наполнения шаблона
  template: string; // Название шаблона из папки templates
  provider?: string; // Провайдер, через которого будет осуществлена отправка (Яндекс, AWS SES, etc)
}
