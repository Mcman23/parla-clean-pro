require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { sequelize } = require('./models')
const authRoutes = require('./routes/auth')
const orderRoutes = require('./routes/orders')
const customerRoutes = require('./routes/customers')
const employeeRoutes = require('./routes/employees')
const serviceRoutes = require('./routes/services')
const paymentRoutes = require('./routes/payments')
const errorHandler = require('./middleware/error')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/payments', paymentRoutes)

app.use(errorHandler)

const port = process.env.PORT || 5000
sequelize.authenticate()
  .then(() => {
    console.log('✅ DB connected')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server on ${port}`))
  })
  .catch(err => {
    console.log('❌ DB error:', err.message)
    app.listen(port, () => console.log(`🚀 Server on ${port} (DB not connected)`))
  })
