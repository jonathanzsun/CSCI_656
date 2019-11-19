module.exports = {
    checkLogin: function checkLogin (req, res, next) {
      if (!req.session.user) {
        req.flash('error', 'User did not login')
        return res.redirect('/signin')
      }
      next()
    },
  
    checkNotLogin: function checkNotLogin (req, res, next) {
      if (req.session.user) {
        req.flash('error', 'User did login')
        return res.redirect('back')// 返回之前的页面
      }
      next()
    }
  }