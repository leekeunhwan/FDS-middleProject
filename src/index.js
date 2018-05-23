import axios from 'axios';

axios.get('http://localhost:3000/posts').then(res=>{
  const listFragment = document.importNode(document.querySelector("#post-list").content, true);
  res.data.forEach(post=>{
    const fragment = document.importNode(document.querySelector('#post-item').content, true);
    const pEl = fragment.createElement('.post-item__title');
    pEl.textContent = post.title;
    listFragment.querySelector('.post-list').appendChild(fragment);
  })

  document.querySelector('.root').appendChild(listFragment);
})