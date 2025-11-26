export class FAQ {
  constructor({ id, question, answer, theme, status, user_id, created_at, updated_at }) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.theme = theme;
    this.status = status;
    this.user_id = user_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static fromRow(row) {
    return new FAQ(row);
  }
}



