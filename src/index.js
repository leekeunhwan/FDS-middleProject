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
  if (localStorage.getItem('token')) {
    const commentsFragment = document.importNode(templates.comments, true);
    rootEl.classList.add('root--loading')
    const commentsRes = await postAPI.get(`/posts/${postId}/comments`);
    rootEl.classList.remove('root--loading')
    commentsRes.data.forEach(comment => {
      const itemFragment = document.importNode(templates.commentItem, true);
      itemFragment.querySelector('.comment-item__body').textContent = comment.body;
      commentsFragment.querySelector('.comments__list').appendChild(itemFragment);
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
