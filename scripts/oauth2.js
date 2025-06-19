// eslint-disable-next-line no-unused-vars
const oAuth2 = {
  /**
   * Initialize
   */
  init() {
    this.KEY = 'BaekjoonHub_token';
    this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
    this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
    this.CLIENT_ID = '975f8d5cf6686dd1faed';
    this.CLIENT_SECRET = '934b2bfc3bb3ad239bc67bdfa81a378b1616dd1e';
    this.REDIRECT_URL = 'https://github.com/'; // for example, https://github.com
    this.SCOPES = ['repo'];
  },

  /**
   * Begin
   */
  begin() {
    this.init(); // secure token params.

    let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URL}&scope=`;
    for (let i = 0; i < this.SCOPES.length; i += 1) {
      url += this.SCOPES[i];
    }

    chrome.storage.local.set({ pipe_baekjoonhub: true }, () => {
      // opening pipe temporarily
      chrome.tabs.create({ url, selected: true }, function () {
        window.close();
        chrome.tabs.getCurrent(function (tab) {
          // chrome.tabs.remove(tab.id, function () {});
        });
      });
    });
  },
};

/**
 * OAuth callback: exchange code for access token and fetch GitHub username
 */
async function fetchAccessTokenAndUsername(code) {
  const data = {
    client_id: oAuth2.CLIENT_ID,
    client_secret: oAuth2.CLIENT_SECRET,
    code: code,
  };

  const res = await fetch(oAuth2.ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  const accessToken = result.access_token;

  if (!accessToken) {
    console.error('Access token not received.');
    return;
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const userData = await userRes.json();
  const githubUsername = userData.login;

  chrome.storage.local.set({
    [oAuth2.KEY]: accessToken,
    githubUsername: githubUsername,
  }, () => {
    console.log('GitHub username stored:', githubUsername);
  });
}

/**
 * Add this to the callback page like welcome.js or popup.js
 */
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    fetchAccessTokenAndUsername(code);
  }
})();
