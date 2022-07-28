import querystring from 'querystring';

import axios from 'axios';
import {Request, Response} from 'express';
import {get} from 'lodash';

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: null;
  blog: string;
  location: string;
  email: null;
  hireable: null;
  bio: null;
  twitter_username: null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
}

// interface Options {
//   GITHUB_CLIENT_ID: string;
//   gitHubRedirectURL: string;
//   path: string;
// }

// const authenticate = ({
//   GITHUB_CLIENT_ID,
//   gitHubRedirectURL,
//   path,
// }: Options): any => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     res.redirect(
//       `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${gitHubRedirectURL}?path=${path}&scope=user:email`,
//     );
//   };
// };

class GithubAuth {
  gitHubRedirectURL = '';
  path = '';
  GITHUB_CLIENT_ID = '';
  GITHUB_CLIENT_SECRET = '';

  constructor(
    GITHUB_CLIENT_ID: string,
    GITHUB_CLIENT_SECRET: string,
    gitHubRedirectURL: string,
    path: string,
  ) {
    this.GITHUB_CLIENT_ID = GITHUB_CLIENT_ID;
    this.GITHUB_CLIENT_SECRET = GITHUB_CLIENT_SECRET;
    this.path = path;
    this.gitHubRedirectURL = gitHubRedirectURL;
    console.log(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
    this.authenticate = this.authenticate.bind(this); // <- Add this
  }

  authenticate(_req: Request, res: Response): void {
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${this.GITHUB_CLIENT_ID}&redirect_uri=${this.gitHubRedirectURL}?path=${this.path}&scope=user:email`,
    );
  }

  async getGitHubUser({code}: {code: string}): Promise<GitHubUser> {
    let githubToken = await axios
      .post(
        `https://github.com/login/oauth/access_token?client_id=${this.GITHUB_CLIENT_ID}&client_secret=${this.GITHUB_CLIENT_SECRET}&code=${code}`,
      )
      .then((res: any) => res.data)

      .catch((error: Error) => {
        console.log(error);
      });

    const decoded = querystring.parse(githubToken);

    const accessToken = decoded.access_token;

    return axios
      .get('https://api.github.com/user', {
        headers: {Authorization: `Bearer ${accessToken}`},
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Error getting user from GitHub`);
        throw error;
      });
  }

  authCallback = async (req: any, res: Response, next: any) => {
    let code = get(req, 'query.code');
    console.log(code);
    code = code;
    if (!code) {
      throw new Error('No code!');
    }
    try {
      const gitHubUser = await this.getGitHubUser({code});
      req.user = {...gitHubUser};
      req.token = code;
      console.log(gitHubUser);
      next();
    } catch (e) {
      console.log(e);
      res.json(e);
    }
  };
}

export default GithubAuth;
