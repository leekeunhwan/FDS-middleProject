import axios from 'axios';

const postAPI = axios.create({});
const rootEl = document.querySelector(".root");


if (localStorage.getItem('token')) {
  postAPI.defaults.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
  rootEl.classList.add('root--authed');
}

const templates = {
  postList: document.querySelector("#post-list").content,
  postItem: document.querySelector("#post-item").content,
  postContent: document.querySelector("#post-content").content,
  login: document.querySelector('#login').content
};

function render(fragment) {
  rootEl.textContent = '';
  rootEl.appendChild(fragment);
}

async function indexPage() {
  const res = await postAPI.get('http://localhost:3000/posts');
  const listFragment = document.importNode(templates.postList, true);
  listFragment.querySelector('.post-list__login-btn').addEventListener('click', e => {
    loginPage();
  })
  listFragment.querySelector('.post-list__logout-btn').addEventListener('click', e => {
    localStorage.removeItem('token');
    delete postAPI.defaults.headers['Authorization'];
    rootEl.classList.remove('root--authed')
    indexPage();
  })
  res.data.forEach(post => {
    const fragment = document.importNode(templates.postItem, true);
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
  const res = await postAPI.get(`http://localhost:3000/posts/${postId}`)
  const fragment = document.importNode(templates.postContent, true)
  fragment.querySelector('.post-content__title').textContent = res.data.title;
  fragment.querySelector(".post-content__body").textContent = res.data.body;
  fragment.querySelector(".post-content__back-btn").addEventListener('click', e => {
    indexPage();
  })
  render(fragment)
}

async function loginPage() {
  const fragment = document.importNode(templates.login, true);
  const formEl = fragment.querySelector('.login__form');
  formEl.addEventListener('submit', async e => {
    const payload = { // 실어서 보낼 객체 생성
      username: e.target.elements.username.value,
      // username: e.target.elements.username === fragment.querySelector('.login__username'); // target은 이벤트가 일어난 객체 e.target에는 form이 들어있음
      password: e.target.elements.password.value
    };
    e.preventDefault();
    // await는 async function 안에서만 사용할 수 있다.
    // 이 await는 비동기 함수안에 포함되어 있지만 지금 실행되는 함수가 비동기일 때만 사용할 수 있기에
    // addEventListner에 event 인자앞에 async를 붙여줘야한다.
    const res = await postAPI.post('http://localhost:3000/users/login', payload);
    localStorage.setItem('token', res.data.token);
    postAPI.defaults.headers['Authorization'] = `Bearer ${res.data.token}`
    rootEl.classList.add('root--authed');
    indexPage();
  })
  render(fragment);
}
indexPage();
