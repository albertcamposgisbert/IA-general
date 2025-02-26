

library(car)
library(logistf)
library(pROC)

data <- read.csv("base_trabajo.csv")
data$Blood.Pressure <- as.numeric(as.character(data$Blood.Pressure))
data$Insulin.Levels <- as.numeric(as.character(data$Insulin.Levels))
data$BMI <- as.numeric(as.character(data$BMI))
data$Cholesterol.Category <- as.factor(data$Cholesterol.Category)

data$Cholesterol.Category <- relevel(data$Cholesterol.Category, ref = "Low")

data$Cholesterol.Category <- ifelse(data$Cholesterol.Category == "High", 1, 
                                    ifelse(data$Cholesterol.Category == "Low", 0, NA))

##########################################################################################
#Model dades desagregades
##########################################################################################
m_desagregades <- glm(Cholesterol.Category ~  Age * Blood.Pressure + Age * BMI
                      + Age * Insulin.Levels,
                      data = data,
                      family = binomial(link = "logit"))
summary(m_desagregades)
residualPlot(m_desagregades)


##########################################################################################
#Model dades agregades
##########################################################################################
dfAgreg <- with(data, aggregate(x = cbind(ypos = Cholesterol.Category, yneg = 
                                            1 - Cholesterol.Category),
                                by = list(Insulin.Levels = Insulin.Levels, 
                                          Age = Age, BMI = BMI, 
                                          Blood.Pressure = Blood.Pressure),
                                FUN = sum))

m_agregades <- glm(cbind(ypos, yneg) ~ Age * Blood.Pressure + Age * BMI 
                   + Age * Insulin.Levels, 
                   data = dfAgreg, 
                   family = binomial(link= "logit"))
summary(m_agregades)


##########################################################################################
#Comparació dels models
##########################################################################################
data.frame(
  des = round(coef(m_desagregades), 3),  # Modelo desagregado (dis)
  agr = round(coef(m_agregades), 3)      # Modelo agregado (agg)
)

c('D_Deviance'           = m_desagregades$deviance,
  'D_Degrees of freedom' = m_desagregades$df.res)
c('A_Deviance'           = m_agregades$deviance,
  'A_Degrees of freedom' = m_agregades$df.res)

daic_value <- m_desagregades$aic
cat("Valor AIC per al model desagregat:", daic_value, "\n")
aaic_value <- m_agregades$aic
cat("Valor AIC per al model agregat:", aaic_value, "\n")

residualPlot(m_agregades)

deviance <- m_agregades$deviance # deviance
df       <- m_agregades$df.res   # degrees of freedom
1 - pchisq(deviance,df)        # p-value for hypothesis test


##########################################################################################
#Model firth
##########################################################################################
m_firth <- logistf(Cholesterol.Category ~ Age * Blood.Pressure + Age * BMI 
                   + Age * Insulin.Levels, data = data)
summary(m_firth)

prediccions_firth <- predict(m_firth, newdata = data, type = "response")
head(prediccions_firth)


##########################################################################################
#Validació del model
##########################################################################################
roc_curve <- roc(data$Cholesterol.Category, prediccions_firth)
plot(roc_curve, main = "ROC Curve - Model de Firth")

auc(roc_curve)

plot(prediccions_firth, main = "Prediccions del Model de Firth",
     ylab = "Probabilitats Predites")
