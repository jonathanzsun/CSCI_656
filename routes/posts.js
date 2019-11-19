const express = require('express')
const router = express.Router()
const checkLogin = require('../middlewares/check').checkLogin
const PostModel = require('../models/posts')

// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function (req, res, next) {
  const author = req.query.author

  PostModel.getPosts(author)
    .then(function (posts) {
      res.render('posts', {
        posts: posts
      })
    })
    .catch(next)
})

// POST /posts/create 发表一篇文章
// POST /posts/create 发表一篇文章
router.post('/create', checkLogin, function (req, res, next) {
  const author = req.session.user._id
  const title = req.fields.title
  const content = req.fields.content

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('need title')
    }
    if (!content.length) {
      throw new Error('need content')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  let post = {
    author: author,
    title: title,
    content: content
  }

  PostModel.create(post)
    .then(function (result) {
      // 此 post 是插入 mongodb 后的值，包含 _id
      post = result.ops[0]
      req.flash('success', 'posted')
      // 发表成功后跳转到该文章页
      res.redirect(`/posts/${post._id}`)
    })
    .catch(next)
})

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function (req, res, next) {
  res.render('create')
})

// GET /posts/:postId 单独一篇的文章页
// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function (req, res, next) {
  const postId = req.params.postId

  Promise.all([
    PostModel.getPostById(postId), // 获取文章信息
    PostModel.incPv(postId)// pv 加 1
  ])
    .then(function (result) {
      const post = result[0]
      if (!post) {
        throw new Error('post not found')
      }

      res.render('post', {
        post: post
      })
    })
    .catch(next)
})

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('post not found')
      }
      if (author.toString() !== post.author._id.toString()) {
        throw new Error('you are not authorized')
      }
      res.render('edit', {
        post: post
      })
    })
    .catch(next)
})

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id
  const title = req.fields.title
  const content = req.fields.content

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('Title here')
    }
    if (!content.length) {
      throw new Error('Content here')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('Cannot find the post')
      }
      if (post.author._id.toString() !== author.toString()) {
        throw new Error('No authorization')
      }
      PostModel.updatePostById(postId, { title: title, content: content })
        .then(function () {
          req.flash('success', 'post edited')
          // 编辑成功后跳转到上一页
          res.redirect(`/posts/${postId}`)
        })
        .catch(next)
    })
})

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('Cannot find the post')
      }
      if (post.author._id.toString() !== author.toString()) {
        throw new Error('No authorization')
      }
      PostModel.delPostById(postId)
        .then(function () {
          req.flash('success', 'post deleted')
          // 删除成功后跳转到主页
          res.redirect('/posts')
        })
        .catch(next)
    })
})

module.exports = router