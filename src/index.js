import axios from 'axios';

const postAPI = axios.create({
  baseURL: process.env.API_URL
});
const rootEl = document.querySelector('.root');

function login(token) {
  localStorage.setItem('token', token);
  postAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  rootEl.classList.add('root--authed');
}

function logout() {
  localStorage.removeItem('token');
  delete postAPI.defaults.headers['Authorization'];
  rootEl.classList.remove('root--authed');
}
const templates = {
  postList: document.querySelector('#post-list').content,
  postItem: document.querySelector('#post-item').content,
  postContent: document.querySelector('#post-content').content,
  login: document.querySelector('#login').content,
  postForm: document.querySelector('#post-form').content,
  comments: document.querySelector('#comments').content,
  commentItem: document.querySelector('#comments-item').content
}

function render(fragment) {
  rootEl.textContent = "";
  rootEl.appendChild(fragment);
}

async function indexPage() {
  rootEl.classList.add('root--loading')
  const res = await postAPI.get('/posts?_expand=user');
  rootEl.classList.remove('root--loading')
  const listFragment = document.importNode(templates.postList, true);

  listFragment.querySelector('.post-list__login-btn').addEventListener('click', e => {
    loginPage();
  })

  listFragment.querySelector('.post-list__logout-btn').addEventListener('click', e => {
    logout();
    indexPage();
  })

  listFragment.querySelector('.post-list__new-post-btn').addEventListener('click', e => {
    postFormPage();
  })

  res.data.forEach(post => {
    const fragment = document.importNode(templates.postItem, true);
    fragment.querySelector('.post-item__author').textContent = post.user.username;
    const pEl = fragment.querySelector('.post-item__title');
    pEl.textContent = post.title;
    pEl.addEventListener('click', e => {
      postContentPage(post.id);
    })
    listFragment.querySelector('.post-list').appendChild(fragment);
  })
  render(listFragment);
}

async function postContentPage(postId) {
  rootEl.classList.add('root--loading')
  const res = await postAPI.get(`/posts/${postId}`);
  rootEl.classList.remove('root--loading')
  const fragment = document.importNode(templates.postContent, true);
  fragment.querySelector('.post-content__title').textContent = res.data.title;
  fragment.querySelector('.post-content__body').textContent = res.data.body;
  fragment.querySelector('.post-content__back-btn').addEventListener('click', e => {
    indexPage();
  })
  fragment.querySelector('.post-content__delete-btn').addEventListener('click', async e => {
    const res = await postAPI.delete(`posts/${postId}`);
    indexPage();
  })
  fragment.querySelector('.post-content__edit-btn')

  if (localStorage.getItem('token')) {
    const commentsFragment = document.importNode(templates.comments, true);
    rootEl.classList.add('root--loading')
    const commentsRes = await postAPI.get(`/posts/${postId}/comments`);
    rootEl.classList.remove('root--loading')
    commentsRes.data.forEach(comment => {
      const itemFragment = document.importNode(templates.commentItem, true);
      const bodyEl = itemFragment.querySelector('.comment-item__body')
      const removeButtonEl = itemFragment.querySelector('.comment-item__remove-btn')
      bodyEl.textContent = comment.body;
      commentsFragment.querySelector('.comments__list').appendChild(itemFragment);
      removeButtonEl.addEventListener('click', async e => {
        bodyEl.remove();
        removeButtonEl.remove();
        const res = await postAPI.delete(`/comments/${comment.id}`)
        // postContentPage(postId);
      })
    })
    const formEl = commentsFragment.querySelector('.comments__form');
    formEl.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        body: e.target.elements.body.value
      };
      rootEl.classList.add('root--loading')
      const res = await postAPI.post(`/posts/${postId}/comments`, payload)
      rootEl.classList.remove('root--loading')
      postContentPage(postId);
    })
    fragment.appendChild(commentsFragment);
  }
  render(fragment);
}

async function loginPage() {
  const fragment = document.importNode(templates.login, true);
  const formEl = fragment.querySelector('.login__form');
  formEl.addEventListener('submit', async e => {
    // e.target.elements.username.value === fragment.querySelector('.login__username');
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    };
    e.preventDefault();
    rootEl.classList.add('root--loading')
    const res = await postAPI.post('/users/login', payload);
    rootEl.classList.remove('root--loading')
    login(res.data.token);
    indexPage();
  })
  render(fragment);
}

async function postFormPage() {
  const fragment = document.importNode(templates.postForm, true);
  fragment.querySelector('.post-form__back-btn').addEventListener('click', e => {
    e.preventDefault();
    indexPage();
  })

  fragment.querySelector('.post-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: e.target.elements.title.value,
      body: e.target.elements.body.value
    };

    rootEl.classList.add('root--loading')
    const res = await postAPI.post('/posts', payload);
    rootEl.classList.remove('root--loading')
    console.log(res);
    postContentPage(res.data.id);
  })

  render(fragment);
}


if (localStorage.getItem('token')) {
  login(localStorage.getItem('token'));
}

indexPage();


// 낙관적 업데이트 - 사용자 입력 -> 화면 갱신 -> 통신 시작 (통신이 잘될거라는 가정이 필요)
// 장점 : 응답 속도가 빠른 것처럼 느껴진다. (사용자 경험이 좋을 수 있다.)
// 단점 : 통신을 실패했을 때의 처리가 복잡해진다.

// 비관적 업데이트 - 통신 시작 -> 통신 끝 -> 화면 갱신
// 장점 : 통신 관련 구현이 단순해진다.
// 단점 : 사용자가 화면이 갱신될 때까지 기다려야 한다. (사용자 경험이 좋지 못할 수 있다.)

// 낙관적 업데이트가 좋다 비관적 업데이트가 좋다라고 말할 수 없다.
// 작은 회사에서 개발자가 한두명일 경우 비관적 업데이트가 좋을 것이고,
// 큰 회사에서 개발자가 많을 경우 낙관적 업데이트가 좋을 수 있듯이
// 환경과 조건에 따라 달라진다.
