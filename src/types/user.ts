export interface IUser {
  id: string,
  name?: string
}

export class User implements IUser {
  public id
  public name = ''
  public loading = false
  constructor(id: string) {
    this.id = id
  }

  getInfo() {
    this.loading = true
    setTimeout(() => {
      this.name = 'Avatar'
      this.loading = false
    }, 2000)
  }
}