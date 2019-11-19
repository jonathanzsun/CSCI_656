const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signup 注册页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signup')
})

// POST /signup 用户注册
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  const bio = req.fields.bio
  const avatar = req.files.avatar.path.split(path.sep).pop()
  let password = req.fields.password
  const repassword = req.fields.repassword

  // 校验参数
  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('Account name must be 1-10 letters')
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('Bio must be 1-30 letters')
    }
    if (!req.files.avatar.name) {
      throw new Error('Need avatar')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 letters')
    }
    if (password !== repassword) {
      throw new Error('Password is not as same as above')
    }
  } catch (e) {
    // 注册失败，异步删除上传的头像
    fs.unlink(req.files.avatar.path)
    req.flash('error', e.message)
    return res.redirect('/signup')
  }

  // 明文密码加密
  var hash = crypto.createHash('sha256')
  password = hash.update(password).digest('utf8') 

  // 待写入数据库的用户信息
  let user = {
    name: name,
    password: password,
    bio: bio,
    avatar: avatar
  }
  // 用户信息写入数据库
  UserModel.create(user)
    .then(function (result) {
      // 此 user 是插入 mongodb 后的值，包含 _id
      user = result.ops[0]
      // 删除密码这种敏感信息，将用户信息存入 session
      delete user.password
      req.session.user = user
      // 写入 flash
      req.flash('success', 'Thanks for sign up.')
      // 跳转到首页
      res.redirect('/posts')
    })
    .catch(function (e) {
      // 注册失败，异步删除上传的头像
      fs.unlink(req.files.avatar.path)
      // 用户名被占用则跳回注册页，而不是错误页
      if (e.message.match('duplicate key')) {
        req.flash('error', 'User account already exits. ')
        return res.redirect('/signup')
      }
      next(e)
    })
})

module.exports = router