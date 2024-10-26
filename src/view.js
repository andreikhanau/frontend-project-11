/* eslint-disable import/no-cycle */
import i18next from 'i18next';
import ru from './locales/ru.js';
import appController from './rssHandler.js';

i18next.init(ru);

const view = {
  getStatusPlace: document.querySelector('p.feedback'),
  getInput: document.querySelector('#url-input'),
  getForm: document.querySelector(
    'body > main > section.container-fluid.bg-dark.p-5 > div > div > form',
  ),
  getPostsDiv: document.querySelector(
    'body > main > section.container-fluid.container-xxl.p-5 > div > div.col-md-10.col-lg-8.order-1.mx-auto.posts',
  ),
  getFeedsDiv: document.querySelector(
    'body > main > section.container-fluid.container-xxl.p-5 > div > div.col-md-10.col-lg-4.mx-auto.order-0.order-lg-1.feeds',
  ),

  normalizeFeeds(feeds) {
    return feeds
      .map(
        ({ title, description }) => `<li class="list-group-item border-0 border-end-0">
                    <h3 class="h6 m-0">${title}</h3>
                    <p class="m-0 small text-black-50">${description}</p>
                </li>`,
      )
      .join('\n');
  },

  normalizePosts(posts) {
    return posts
      .map(
        ({ link, title, id }) => `<li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
                  <a href="${link}" class="fw-bold" data-id="${id}" target="_blank" rel="noopener noreferrer">
                    ${title}
                  </a>
                  <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal" data-bs-target="#modal">
                    Просмотр
                  </button>
                </li>`,
      )
      .join('\n');
  },
  renderFeeds(feeds) {
    this.getFeedsDiv.innerHTML = `
            <div class="card border-0">
                <div class="card-body">
                    <h2 class="card-title h4">Фиды</h2>
                </div>
                <ul class="list-group border-0 rounded-0">
                    ${this.normalizeFeeds(feeds)}
                </ul>
            </div>`;
  },

  renderPosts(posts) {
    this.getPostsDiv.innerHTML = `
            <div class="card border-0">
                <div class="card-body">
                    <h2 class="card-title h4">Посты</h2>
                </div>
                <ul class="list-group border-0 rounded-0">
                    ${this.normalizePosts(posts)}
                </ul>
            </div>`;
  },
  shadeLinks(links) {
    return links.forEach((id) => {
      const findElement = document.querySelector(`[data-id="${id}"]`);
      findElement.classList.remove('fw-bold');
      findElement.classList.add('fw-normal', 'link-secondary');
    });
  },

  render(state) {
    if (state.error) {
      this.getStatusPlace.classList.add('text-danger');
      this.getStatusPlace.classList.remove('text-success');
      this.getInput.classList.add('is-invalid');
      this.getInput.classList.remove('is-valid');
      this.getStatusPlace.textContent = state.error;
      this.shadeLinks(state.clickedLinks);
    } else {
      this.getStatusPlace.classList.add('text-success');
      this.getStatusPlace.classList.remove('text-danger');
      this.getInput.classList.add('is-valid');
      this.getInput.classList.remove('is-invalid');
      this.getForm.reset();
      this.getInput.focus();
      this.renderFeeds(state.feeds);
      this.renderPosts(state.posts);
      this.getStatusPlace.textContent = state.statusMessage;
      appController.modalHandler();
      this.shadeLinks(state.clickedLinks);
    }
  },
};
export default view;
