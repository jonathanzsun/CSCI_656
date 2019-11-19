const crypto = require('crypto')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signin 登录页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signin')
})

// POST /signin 用户登录
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  const password = req.fields.password

  // 校验参数
  try {
    if (!name.length) {
      throw new Error('account is missing')
    }
    if (!password.length) {
      throw new Error('password is missing')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  UserModel.getUserByName(name)
    .then(function (user) {
      if (!user) {
        req.flash('error', 'no such account')
        return res.redirect('back')
      }
      // 检查密码是否匹配
      if (crypto.createHash('sha256').update(password).digest('utf8')  !== user.password) {
        req.flash('error', 'wrong password')
        return res.redirect('back')
      }
      req.flash('success', 'You are logged in')
      // 用户信息写入 session
      delete user.password
      req.session.user = user
      // 跳转到主页
      res.redirect('/posts')
    })
    .catch(next)
})

module.exports = router
