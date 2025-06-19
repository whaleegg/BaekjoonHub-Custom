/** 푼 문제들에 대한 단일 업로드는 uploadGit 함수로 합니다.
 * 파라미터는 아래와 같습니다.
 * @param {string} filePath - 업로드할 파일의 경로
 * @param {string} sourceCode - 업로드하는 소스코드 내용
 * @param {string} readme - 업로드하는 README 내용
 * @param {string} filename - 업로드할 파일명
 * @param {string} commitMessage - 커밋 메시지
 * @param {function} cb - 콜백 함수 (ex. 업로드 후 로딩 아이콘 처리 등)
 * @returns {Promise<void>}
 */
async function uploadOneSolveProblemOnGit(bojData, cb) {
  const token = await getToken();
  const hook = await getHook();
  if (isNull(token) || isNull(hook)) {
    console.error('token or hook is null', token, hook);
    return;
  }
  return upload(token, hook, bojData.code, bojData.readme, bojData.directory, bojData.fileName, bojData.message, cb);
}

// /**
//  * GitHub 사용자명을 chrome.storage.local에서 가져옵니다.
//  */
// async function getGithubUsernameFromStorage() {
//   return new Promise((resolve) => {
//     chrome.storage.local.get(['githubUsername'], (result) => {
//       resolve(result.githubUsername || 'unknown');
//     });
//   });
// }

/** Github api를 사용하여 업로드를 합니다.
 * @see https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
 * @param {string} token - github api 토큰
 * @param {string} hook - github api hook
 * @param {string} sourceText - 업로드할 소스코드
 * @param {string} readmeText - 업로드할 readme
 * @param {string} directory - 업로드할 파일의 경로
 * @param {string} filename - 업로드할 파일명
 * @param {string} commitMessage - 커밋 메시지
 * @param {function} cb - 콜백 함수 (ex. 업로드 후 로딩 아이콘 처리 등)
 */
async function upload(token, hook, sourceText, readmeText, directory, filename, commitMessage, cb) {
  const git = new GitHub(hook, token);
  const stats = await getStats();
  let default_branch = stats.branches[hook];
  if (isNull(default_branch)) {
    default_branch = await git.getDefaultBranchOnRepo();
    stats.branches[hook] = default_branch;
  }
  const { refSHA, ref } = await git.getReference(default_branch);
  const source = await git.createBlob(sourceText, `${directory}/${filename}`);

  let githubUsername = '';
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['GithubUsername'], resolve);  // 대문자 G 주의!
    });
    githubUsername = result.GithubUsername || 'default_user';
  } catch (error) {
    console.error("GitHub 사용자 이름 로드 중 오류 발생:", error);
    githubUsername = 'error_retrieving_username';
  }

  const readme = await git.createBlob(readmeText, `${directory}/README_${githubUsername}.md`);

  const treeSHA = await git.createTree(refSHA, [source, readme]);
  const commitSHA = await git.createCommit(commitMessage, treeSHA, refSHA);
  await git.updateHead(ref, commitSHA);

  updateObjectDatafromPath(stats.submission, `${hook}/${source.path}`, source.sha);
  updateObjectDatafromPath(stats.submission, `${hook}/${readme.path}`, readme.sha);
  await saveStats(stats);

  if (typeof cb === 'function') {
    cb(stats.branches, directory);
  }
}
