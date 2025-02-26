

ddiab   <- read.csv("diabetes_data.csv")
library(car)

##########################################################################################
#Model bàsic inicial
##########################################################################################
dmlgz_t  <- glm(Insulin.Levels ~ . -Target, family=gaussian, ddiab)
summary(dmlgz_t)


##########################################################################################
#Model bàsic amb variables significatives
##########################################################################################
dmlgz_v  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels + Birth.Weight, family=gaussian, ddiab)
summary(dmlgz_v)


##########################################################################################
#Model bàsic amb variables significatives y les seves interaccions
##########################################################################################
dmlgz_int  <- glm(Insulin.Levels ~ (Age + BMI + Blood.Pressure + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels + Birth.Weight)^2, family=gaussian, ddiab)
summary(dmlgz_int)

##########################################################################################
#Model bàsic amb variables y interaccions significatives 
##########################################################################################
dmlgz_i  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure + Cholesterol.Levels 
                + Waist.Circumference + Blood.Glucose.Levels + Birth.Weight + Age*BMI 
                + Age*Blood.Pressure + Age*Cholesterol.Levels + Age*Waist.Circumference 
                + Age*Blood.Glucose.Levels + Age*Birth.Weight + BMI*Blood.Pressure 
                + BMI*Waist.Circumference + BMI*Birth.Weight + Blood.Pressure*Waist.Circumference 
                + Blood.Pressure*Blood.Glucose.Levels + Blood.Glucose.Levels*Waist.Circumference 
                + Blood.Glucose.Levels*Birth.Weight, family=gaussian, ddiab)
summary(dmlgz_i)

cat("Deviancia residual sense interacció:", dmlgz_v$deviance, "\n")
cat("Deviancia residual amb interacció:", dmlgz_i$deviance, "\n")

##########################################################################################
#Estudi de la familia més adient 
##########################################################################################
dmlgz_gaus  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure 
                   + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels 
                   + Birth.Weight + Age*BMI + Age*Blood.Pressure + Age*Cholesterol.Levels 
                   + Age*Waist.Circumference + Age*Blood.Glucose.Levels + Age*Birth.Weight 
                   + BMI*Blood.Pressure + BMI*Waist.Circumference + BMI*Birth.Weight 
                   + Blood.Pressure*Waist.Circumference + Blood.Pressure*Blood.Glucose.Levels 
                   + Blood.Glucose.Levels*Waist.Circumference + Blood.Glucose.Levels*Birth.Weight, family=gaussian, ddiab)

dmlgz_gam  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure 
                  + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels 
                  + Birth.Weight + Age*BMI + Age*Blood.Pressure + Age*Cholesterol.Levels 
                  + Age*Waist.Circumference + Age*Blood.Glucose.Levels + Age*Birth.Weight 
                  + BMI*Blood.Pressure + BMI*Waist.Circumference + BMI*Birth.Weight 
                  + Blood.Pressure*Waist.Circumference + Blood.Pressure*Blood.Glucose.Levels 
                  + Blood.Glucose.Levels*Waist.Circumference + Blood.Glucose.Levels*Birth.Weight, family=Gamma, ddiab)

dmlgz_invgaus  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure 
                      + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels 
                      + Birth.Weight + Age*BMI + Age*Blood.Pressure + Age*Cholesterol.Levels 
                      + Age*Waist.Circumference + Age*Blood.Glucose.Levels + Age*Birth.Weight 
                      + BMI*Blood.Pressure + BMI*Waist.Circumference + BMI*Birth.Weight 
                      + Blood.Pressure*Waist.Circumference + Blood.Pressure*Blood.Glucose.Levels 
                      + Blood.Glucose.Levels*Waist.Circumference + Blood.Glucose.Levels*Birth.Weight, family=inverse.gaussian(), ddiab)

residualPlot(dmlgz_gaus,    main='Gaussian')
residualPlot(dmlgz_gam,    main='Gamma')
residualPlot(dmlgz_invgaus,    main='Inverse Gaussian')


##########################################################################################
#Model amb familia Gaussiana buscant variables significatives
##########################################################################################
dmlgz_gam_t  <- glm(Insulin.Levels ~ . -Target, family=Gamma, ddiab)
summary(dmlgz_gam)


##########################################################################################
#Model amb familia Gaussiana buscant interaccions significatives
##########################################################################################
dmlgz_gamv  <- glm(Insulin.Levels ~ (Age + BMI + Blood.Pressure + Cholesterol.Levels + Waist.Circumference + Blood.Glucose.Levels + Birth.Weight + Pancreatic.Health)^2, family=Gamma, ddiab)
summary(dmlgz_gamv)


##########################################################################################
#Model final
##########################################################################################
dmlgz_def  <- glm(Insulin.Levels ~ Age + BMI + Blood.Pressure + Cholesterol.Levels 
                  + Waist.Circumference + Blood.Glucose.Levels + Birth.Weight 
                  + Pancreatic.Health + Age*BMI + Age*Blood.Pressure + Age*Cholesterol.Levels
                  + Age*Waist.Circumference + Age*Blood.Glucose.Levels 
                  + Age*Birth.Weight + Age*Pancreatic.Health  + BMI*Cholesterol.Levels 
                  + BMI*Blood.Pressure + BMI*Waist.Circumference + Blood.Pressure*Blood.Glucose.Levels 
                  + Blood.Pressure*Pancreatic.Health + Blood.Glucose.Levels*Waist.Circumference 
                  + Blood.Glucose.Levels*Pancreatic.Health, family=Gamma, ddiab)

cat("Deviancia residual amb les interaccions pertanyents a la familia Gamma:", dmlgz_def$deviance, "\n")


##########################################################################################
#MValidació del model
##########################################################################################
residualPlot(dmlgz_def)


