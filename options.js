document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);

function saveOptions() {
    const nickname = document.getElementById('githubNicknameInput').value.trim();
    if (nickname) {
        chrome.storage.sync.set({ githubNickname: nickname }, () => {
            const status = document.getElementById('status');
            status.textContent = '설정이 저장되었습니다!';
            setTimeout(() => {
                status.textContent = '';
            }, 1500);
        });
    } else {
        const status = document.getElementById('status');
        status.textContent = '닉네임을 비워둘 수 없습니다.';
        status.style.color = 'red';
        setTimeout(() => {
            status.textContent = '';
            status.style.color = 'green'; // 색상 초기화
        }, 1500);
    }
}

function restoreOptions() {
    // 저장된 닉네임을 불러와 input 필드에 표시
    chrome.storage.sync.get(['githubNickname'], (result) => {
        document.getElementById('githubNicknameInput').value = result.githubNickname || '';
    });
}