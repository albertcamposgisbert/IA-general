

library(fpp)

Diabetes <- ts(a10,start = 1992, frequency = 12)
plot(Diabetes)

################################################################################
# Aplicació transformació logarítmica
################################################################################
lndiabetes <- log(Diabetes)
plot(lndiabetes)
plot(decompose(lndiabetes)) 

################################################################################
# ACF i PACF
################################################################################
par(mfrow=c(1,2))
acf(lndiabetes, ylim=c(-1,1), lag.max = 40)
pacf(lndiabetes, ylim=c(-1,1), lag.max = 40)

################################################################################
# Diferenciació d'ordre 12
################################################################################
par(mfrow=c(1,1))
d12lndiabetes <- diff(lndiabetes, lag=12)
plot(d12lndiabetes)

################################################################################
# ACF PCF ordre 12
################################################################################
par(mfrow=c(1,2))
acf(d12lndiabetes, ylim = c(-1,1), lag.max = 40)
pacf(d12lndiabetes, ylim = c(-1,1), lag.max = 40)

################################################################################
# Diferenciació d'ordre 1
################################################################################
d1d12lndiabetes <- diff(  d12lndiabetes)
plot(d1d12lndiabetes)

par(mfrow=c(1,2))
plot(Diabetes)
plot(d1d12lndiabetes)

################################################################################
# ACF PCF ordre 1
################################################################################
par(mfrow=c(1,2))
acf(d1d12lndiabetes, ylim=c(-1,1), lag.max = 48) #es mira q i Q
pacf(d1d12lndiabetes, ylim=c(-1,1), lag.max = 48) #es mira p i P

################################################################################
# Ajust model 1
################################################################################
diabetes.arima1a <- arima(lndiabetes,
                          order    = c(2,1,1), 
                          seasonal = list(order = c(0,1,3), 
                                          period = 12))

##Significatius

ratios <- round(abs(diabetes.arima1a$coef/sqrt(diag(diabetes.arima1a$var.coef))),2)
ratios
ratios>2

################################################################################
# Ajust model 2
################################################################################
diabetes.arima2 <- arima(lndiabetes,
                         order    = c(1,1,1), 
                         seasonal = list(order = c(0,1,3), 
                                         period = 12))

##Significatius

ratios <- round(abs(diabetes.arima2$coef/sqrt(diag(diabetes.arima2$var.coef))),2)
ratios
ratios>2  

################################################################################
# Model definitiu
################################################################################
AIC(diabetes.arima1a)
AIC(diabetes.arima2)  #AIC quant més baix millor

mod_deff <- diabetes.arima2

################################################################################
# Comprobació de la homoscedasticitat
################################################################################
residd <- mod_deff$residuals
par(mfrow=c(1,2), mar=c(3,3,3,3))
plot(residd, main="Residuals")
abline(h = c(0 , -3*sd(residd), 3*sd(residd)), lty = c(1,3,3), col=c(1,4,4))
scatter.smooth(sqrt(abs(residd)), 
               main="Square Root of Absolute residuals",
               lpars = list(col=2))

################################################################################
# Comprobació de la normalitat
################################################################################
par(mfrow=c(1,2), mar=c(3,3,3,3))
qqnorm(residd)
qqline(residd,col=2,lwd=2)
hist(residd, breaks = 10, freq=F)
curve(dnorm(x, mean = mean(residd), sd = sd(residd)), col=2, add=T)

################################################################################
# Comprobació de la independéncia
################################################################################
tsdiag(mod_deff, gof.lag = 40)

################################################################################
# Predicció
################################################################################
# Calcul de les prediccions i de l'error estandard
predd   <- predict(mod_deff, n.ahead=24) #24 es 2 años
pr_logd <- predd$pred
se_logd <- predd$se

# Intervals de logs
li_logd <- pr_logd - 1.96 * se_logd # limit inferior log
ls_logd <- pr_logd + 1.96 * se_logd # limit superior log

# Desfer logaritmes
li <- ts(exp(li_logd), start = 2009, freq=12)
pr <- ts(exp(pr_logd), start = 2009, freq=12)
ls <- ts(exp(ls_logd), start = 2009, freq=12)

# Grafic
par(mfrow=c(1,1))
ts.plot(Diabetes,
        li, ls, pr,
        lty  = c(1,2,2,1), col=c("black","blue","blue","red"),
        xlim = c(1992,2011))


