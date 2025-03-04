################################################################################
#
# ME - GIA. Introduction to hierarchical clustering
#
#--------------------------------------
# Concepts
#--------------------------------------
#
# Hierarchical clustering
################################################################################

rm(list=ls())

############################################################
# Load packages
############################################################
library(NbClust)    # Function NbClust
library(factoextra) # Several clustering graphics
library(hopkins)    # Hopkins index
library(FactoMineR) # Factor analysis
library(dendextend) # Compare dendograms
library(corrplot)   # Correlation graphics
library(dendextend) # tanglegram

################################################################################
# Apply hierarchical clustering to the wine.txt dataset
################################################################################

################################################################################
# 1. Read data
################################################################################
wine <- read.table('Dades/wine.txt',sep=',',header=TRUE)

################################################################################
# 2. Make a descriptive analysis without scaling
################################################################################
summary(wine)
pairs(wine)

################################################################################
# 3. Scale the data
################################################################################
wine2 <- scale(wine)

################################################################################
# 4. Compare the 4 dendrograms resulting from using the euclidean/manhattan 
# distance and the wald/complete method. What influences more the type of 
# distance (euclidean/manhattan) or the type of grouping (wald/complete)?
################################################################################
d1 <- dist(wine2,method='euclidean')
d2 <- dist(wine2,method='manhattan')
hc1 <- hclust(d1,method = "ward.D2") ; cor(d1, cophenetic(hc1))    
hc2 <- hclust(d1,method = "complete") ; cor(d1, cophenetic(hc2))    
hc3 <- hclust(d2,method = "ward.D2") ; cor(d2, cophenetic(hc3))    
hc4 <- hclust(d2,method = "complete") ; cor(d2, cophenetic(hc4))

windows()
par(mfrow=c(4,1),las=1)
plot(hc1,cex=0.7)
plot(hc2,cex=0.7)
plot(hc3,cex=0.7)
plot(hc4,cex=0.7)

# comparison 2 by 2
tanglegram(hc1,hc2)
tanglegram(hc1,hc3)
tanglegram(hc1,hc4)
tanglegram(hc2,hc3)
tanglegram(hc2,hc4)
tanglegram(hc3,hc4)

# correlations 2 by 2
library(corrplot)
dend_list <- dendlist("E-W" = as.dendrogram(hc1), "E-C" = as.dendrogram(hc2),
                      "M-W" = as.dendrogram(hc3), "M-C" = as.dendrogram(hc4))
cors <- cor.dendlist(dend_list)
par(mfrow=c(1,1))
corrplot(cors, "pie", "lower")

################################################################################
# 5. According to the 4 dendrograms, how many wine groups do you think there are? 
# Make the partition according to the number of groups you think convenient for 
# each of the methods
################################################################################
ct1 <- cutree(hc1,k=3)
ct2 <- cutree(hc2,k=3)
ct3 <- cutree(hc3,k=3)
ct4 <- cutree(hc4,k=3)

################################################################################
# 6. Represents the 4 partitions in the first 2 principal components
# What combination do you think is more appropriate?
################################################################################
pr <- princomp(wine2)
x <- pr$scores[,1]
y <- pr$scores[,2]
par(mfrow=c(2,2),las=1)
plot(x,y,col=ct1,pch=19)
plot(x,y,col=ct2,pch=19)
plot(x,y,col=ct3,pch=19)
plot(x,y,col=ct4,pch=19)

################################################################################
# 7. Choose a partition of the above and calculate the % of explained variability 
##-- Inercia between 
################################################################################
##-- Between-groups Inertia
IB <- 0
for(i in 1:3){
  w <- wine[ct1==i,]
  n <- sum(ct1==i)
  ymean <- apply(wine,2,mean)
  ymeangroup <- apply(w,2,mean)
  ib <- n*sum((ymeangroup-ymean)^2)
  IB <- IB + ib
}

##-- Total Inertia
IT <- sum(apply(scale(wine,scale=FALSE)^2,2,sum,na.rm=TRUE))

##-- Explained variability
VE <- round(100*IB/IT,2)
VE


# 8. Define the most relevant characteristics of each group of wines according to 
# the chosen classification. In what characteristic do they differ more?
apply(wine,2,tapply,ct1,summary)

pca <- PCA(wine,graph=FALSE)
par(mfrow=c(1,2))
plot(pca,col.ind=ct1,label='none')
plot(pca,choix = "var",cex=0.7)

par(mfrow=c(4,4),las=1)
for(i in 1:13) boxplot(wine2[,i]~ct1,main=colnames(wine2)[i])
