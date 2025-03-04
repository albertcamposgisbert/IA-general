################################################################################
#
# ME - GIA. Kmeans and HC using Gower distance
#
#--------------------------------------
# Concepts
#--------------------------------------
#
# Clustering using GOWER distance
################################################################################
#
# Database CREDSCO
# Check documentation in credscoInfo.pdf
################################################################################

rm(list=ls())

################################################################################
# Load packages
################################################################################
library(cluster)
library(clustMixType)

################################################################################
# Load the Database
################################################################################
d <- read.csv("Dades/credscoDB.csv", sep=";", stringsAsFactors = TRUE)
names(d)
dim(d)
summary(d)

# Set a list of numerical variables
d_con <- with(d, data.frame (Antiguedad.Trabajo, Plazo, Edad, Gastos, Ingresos,
                             Patrimonio, Cargas.patrimoniales, Importe.solicitado,
                             Precio.del.bien.financiado, Estalvi, RatiFin))
dim(d_con)

################################################################################
# CLUSTERING --> Only numerical features
# Example with K=5
################################################################################
set.seed(12345)
# Without scaling
km1 <- kmeans(d_con, centers = 5, nstart = 10)
km1
km1$size
km1$centers

# Perform the same by scaling the database and compare with km1
d_con_s <- scale(d_con)
km2 <- kmeans(d_con_s, center = 5, nstart = 10)
km2$size

# Comparing assigments
t1 <- table(km1$cluster,km2$cluster)
t1
randIndex(t1)

# Comparing centers
heatmap(km1$centers)
heatmap(km2$centers)

################################################################################
# CLUSTERING --> Numerical and categorical features
################################################################################
# K-prototypes
dd <- d[,-1]
kp <- kproto(dd, k =  5, type = "gower")
kp$centers

# Compare with previous
t2 <- table(km1$cluster,kp$cluster)
t2
randIndex(t2)

t3 <- table(km2$cluster,kp$cluster)
t3
randIndex(t3)

################################################################################
# HIERARCHICAL CLUSTERING
# Let's move to Gower mixed distance to deal 
# simoultaneously with numerical and qualitative data
################################################################################

# Dissimilarity matrix
actives <- c(2:16)
dissimMatrix <- daisy(d[,actives], metric = "gower", stand = TRUE)
View(as.matrix(dissimMatrix)[1:10,1:10])
distMatrix   <- dissimMatrix^2
h1 <- hclust(distMatrix, method = "ward.D2")  # NOTICE THE COST
plot(h1)
c2 <- cutree(h1,4)


### Function suggested level
suggested.level<-function(hc, min=3, max=10){
  
  if(min<2) stop("Min should be equal or higher than 2")
  intra    <- rev(cumsum(hc$height))
  quot     <- intra[min:(max)]/intra[(min - 1):(max - 1)]
  nb_clust <- which.min(quot) + min - 1
  return(nb_clust)
}
suggested.level(h1)

# Run clusters with the suggested level, here is 3
c3 <- cutree(h1,3)

# Class sizes 
table(c3)

################################################################################
# Describing RESULTS
# PROFILING
################################################################################

par(mfrow=c(2,2))
boxplot(RatiFin~c3, d) 
boxplot(Patrimonio~c3, d) 
boxplot(Gastos~c3, d) 
boxplot(Plazo~c3, d)


# Centroids for numerical features
cdg <- aggregate(as.data.frame(d_con),list(c3),mean)
cdg

# Tables for categorical data
# Example: Vivienda
table1 <- table(d$Vivienda, c3)
barplot(prop.table(table(d$Vivienda,c3),2),legend=TRUE)

# Table with Proportions
prop.table(table1)
prop.table(table1, margin=1)*100
prop.table(table1, margin=2)*100
