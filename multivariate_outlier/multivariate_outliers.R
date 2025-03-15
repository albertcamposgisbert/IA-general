
library(readr)
library(mvoutlier)
library(MVN)
library(chemometrics)
library(DMwR2)
library(Rlof)
library(scatterplot3d)
library(plotly)
library(rgl)
library(adamethods)
library(dplyr)
library(ggplot2)

setwd("C:/Users/albert/Desktop/multivariate_outlier")
dades <- read.csv("Airbnb_Clean_Data.csv", stringsAsFactors = FALSE)
View(dades)

varNum <- names(dades)[sapply(dades, is.numeric)]
print(varNum)

varNum <- varNum[!varNum %in% c("id", "host.id", "review_rate_number", "calculated_host_listings_count")]
numericas <- dades[, varNum]
numericas <- numericas[complete.cases(numericas), ]
numericas <- as.matrix(numericas)

unique_counts <- apply(numericas, 2, function(x) length(unique(x)))
cat("Número de valores únicos por variable:\n")
print(unique_counts)


Y <- scale(numericas)

# Aplicar dd.plot (mvoutlier)
# dd.plot utiliza el método robusto (covMcd) para detectar outliers multivariantes.
distances <- dd.plot(Y, quan = 1/2, alpha = 0.025)
cat("Distancias clásicas (md.cla):\n")
print(distances$md.cla)
cat("Distancias robustas (md.rob):\n")
print(distances$md.rob)


# Usar el paquete MVN para detectar outliers (método 'adj')
mvnoutliers <- mvn(numericas, multivariateOutlierMethod = "adj", 
                   showOutliers = TRUE, showNewData = TRUE)
cat("Outliers detectados con MVN (método adj):\n")
print(mvnoutliers$multivariateOutliers)
cat("Datos sin los outliers según MVN:\n")
print(mvnoutliers$newData)

## Compara la densidat de un punt amb la densidat dels seus veïns. Un valor LOF alt
library(DMwR2)
library(dplyr)

outlier.scores <- lofactor(dades[, c("DC", "temp", "RH")], k = 5)
par(mfrow=c(1,1))
plot(density(outlier.scores))
outlier.scores
outliers <- order(outlier.scores, decreasing=T)
outliers <- order(outlier.scores, decreasing=T)[1:5]

