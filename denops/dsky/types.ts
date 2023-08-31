export class Post {
  author: string;
  text: string;
  constructor(post: any) {
    this.author = post.author.displayName;
    this.text = post.record.text;
  }
}

export class Session {
  did: string;
  handle: string;
  email: string;
  accessJwt: string;
  refreshJwt: string;
  constructor(session: any) {
    this.did = session.did;
    this.handle = session.handle;
    this.email = session.email;
    this.accessJwt = session.accessJwt;
    this.refreshJwt = session.refreshJwt;
  }
}
