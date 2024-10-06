################################################################################
#
# ME - GIA. Repas Model Lineal General
#
# En un estudi per estudiar el nivell de colesterol en sang, en persones en edat 
# de creixement (9-20 anys), s'ha plantejat un model per explicar el nivell de 
# colesterol (C) en funció del pes (P), edat (E) i alçada (H).
#
#--------------------------------------
# Conceptes
# -------------------------------------
# Ajust del model
# Comparar amb model nul (test omnibus)
# Intervals de confianca i prediccio
# Validacio
# Confusio
# Colinealitat
################################################################################


#-------------------------------------------------------------------------------
# Carregar llibreries i dades
#-------------------------------------------------------------------------------
library(car) # sp, vif,...
library(HH)  # ci.plot
dd <- read.csv2("../Dades/col.csv")

#-------------------------------------------------------------------------------
# Descriptiva: recta de regressió del colesterol respecte el pes
#-------------------------------------------------------------------------------
sp(C~P,boxplot=F,smooth=F,dd)

#-------------------------------------------------------------------------------
# Model Nul i amb la variable Pes
#-------------------------------------------------------------------------------

##-- Models 
mod0 <- lm(C~1,dd)  # Nul
mod1 <- lm(C~P,dd)  # Pes
summary(mod0)
summary(mod1)

##-- Comparar models
anova(mod0,mod1)     # Test Omnibus --> Comparativa respecte al model Nul

#-------------------------------------------------------------------------------
# Intervals de confianca i prediccio
#-------------------------------------------------------------------------------
CC <- predict(mod1,interval="confidence",alpha=0.01)
CP <- predict(mod1,interval="prediction",alpha=0.01)
O  <- order(dd$P)

plot(C~P, dd, ylim = c(min(CP,dd$C), max(CP,dd$C)), # Punts
     ylab="C",xlab="P", main="Banda predicció 99%")
lines(dd$P[O],CC[O,"fit"],lty=2,col="black")        # Estimacio puntual

lines(dd$P[O],CC[O,"lwr"],lty=2,col="blue")         # Interval de confianca
lines(dd$P[O],CC[O,"upr"],lty=2,col="blue")

lines(dd$P[O],CP[O,"lwr"],lty=2,col="red")          # Interval de prediccio
lines(dd$P[O],CP[O,"upr"],lty=2,col="red")


#-------------------------------------------------------------------------------
# Validacio
#----------
# Premisses: 
# 1) Linealitat (1r grafic)
# 2) Homoscedasticitat (1r i 3r grafic)
# 3) Normalitat (2n grafic)
# 4) Independencia (No avaluable?)
#-------------------------------------------------------------------------------
# Grafics de residus
par(mfrow=c(2,2))
plot(mod1)

# Independencia respecte a l'ordre
par(mfrow = c(1,1))
plot(resid(mod1), type = 'l')
abline(h = 0,lty = 2)

# Valors influents i mal explicats
influencePlot(mod1)


#-------------------------------------------------------------------------------
# Confusio: L'efecte d'una variable sobre un altre canvia al ajustar per una tercera
#-------------------------------------------------------------------------------

##-- Influencia del pes al ajustar per la edat
scatterplot(C~P|E, smooth=F, boxplots=F, col=1:12, dd)

##-- Model de regressio multiple
mod2 <- lm(C ~ P + E + H, data =  dd)
summary(mod2)

##-- Test omnibus
anova(mod0,mod2)

#-------------------------------------------------------------------------------
# Colinealitat: Variance inflation factor (VIF)
#-------------------------------------------------------------------------------
vif(mod2)

# Solucionem colinealitat afegint l'exces de pes, ja que tenim un patró del pes.
# Exces_pes = max(0, 0.5*alçada - 10)
dd$EP <- pmax(0, dd$P-(dd$H/2-10))

# Model amb 2 variables
mod3 <- lm(C ~ EP + E, dd) 
summary(mod3)

# VIF
vif(mod3)

#-------------------------------------------------------------------------------
# Validacio
#-------------------------------------------------------------------------------
# Grafics de residus
par(mfrow=c(2,2))
plot(mod3)

# Grafics de residus (llibreria car)
residualPlots(mod3)

#-------------------------------------------------------------------------------
# Termes polinomics. No es necessita terme quadratic
#------------------------------------------------------------------------------- 
mod4 <- lm(C ~ EP + poly(E,2), dd) 
summary(mod4)

#-------------------------------------------------------------------------------
# Model final. Prediccions
#------------------------------------------------------------------------------- 
mod_def <- mod3

# Banda de prediccio variant amb la edat sense Exces de pes (EP = 0)
edat <- 9:20
df0  <- data.frame(E = edat, EP = 0)
CC1  <- predict(mod_def, df0, interval="confidence")
CP1  <- predict(mod_def, df0, interval="prediction")

plot(edat,CC1[,"fit"],ty="l",ylim=c(min(CP1),max(CP1)), ylab="C",
     main="Interval 95% de confianca i predicció del colesterol \n dels que no tenen excès de pes")

lines(edat,CC1[,"lwr"],lty=2,col="blue")  # Interval de confianca
lines(edat,CC1[,"upr"],lty=2,col="blue")

lines(edat,CP1[,"lwr"],lty=2,col="red")   # Interval de prediccio
lines(edat,CP1[,"upr"],lty=2,col="red")

# Interval de prediccio i confiança del 90% per una persona amb:  
# P=65, E=15 i H=150
df1 <- data.frame(EP = max(0,65-(150/2-10)), E=15)
predict(mod_def, df1, interval="confidence", level=.90)
predict(mod_def, df1, interval="prediction", level=.90)

