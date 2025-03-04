rm(list=ls())

# ------------------------------------------------------------------------------
# Libraries
# ------------------------------------------------------------------------------
# Load necessary libraries
# install.packages("daewr")
# install.packages("DoE.base")
# install.packages("AlgDesign")
# install.packages("qcc")
library(daewr)      # Fractional factorial designs and analysis
library(DoE.base)   # Factorial and Latin square designs
library(AlgDesign)  # Optimal designs
library(qcc)        # pareto.chart

##-- Parameters
f <- function(letter,nlev) paste0(letter,1:nlev)
fac_names_1 <- list(A = f('A',2), B = f('B',2),
                    C = f('C',2))
fac_names_2 <- list(A = f('A',2), B = f('B',3),
                    C = f('C',4)) 
fac_names_3 <- list(A = f('A',2), B = f('B',2),
                    C = f('C',2), D = f('D',2),
                    E = f('E',2), F = f('F',2))

# ------------------------------------------------------------------------------
# Full Factorial Design
# ------------------------------------------------------------------------------
# Example 1a: A 2^3 factorial design with three factors (A, B, C) and 2 replications
set.seed(12345)     # order is random
d_full_1 <- fac.design(nlevels      = c(2, 2, 2), 
                       factor.names = fac_names_1,
                       replications = 2)
d_full_1

# Add random outcome
d_full_1$outcome <- rnorm(nrow(d_full_1), mean = 10, sd = 2)

# Analyze the design using ANOVA
anova_full <- aov(outcome ~ A * B * C, data = d_full_1)
summary(anova_full)

# Analyze the design using lm
mod_1a <- lm(outcome ~ A * B * C, data = d_full_1)
mod_1a

# Orthogonality
dm <- model.matrix(mod_1a)# Design matrix
qr(mod_1a)$rank           # Orthogonal? Yes <-- Rank is 8
cor(dm)                   # Orthogonal? Yes <-- Correlation is 0
sum(dm[,1] * dm[,2])      # Orthogonal? Yes <-- Dot product is null

# Are the effects still the same if we remove some effects
mod_1b <- lm(outcome ~ A + B + C, data = d_full_1)
mod_1b

# Effects
summary(mod_1a)
effects <- abs(coef(mod_1a))[-1]
pareto.chart(effects, main = "Pareto Chart of Effects")

# Example 2: three factors with 2, 3 and 4 levels and 1 replication
set.seed(12345)     # order is random
d_full_2 <- fac.design(nlevels      = c(2, 3, 4), 
                       factor.names = fac_names_2,
                       replications = 1)
d_full_2

# Add non-random outcome
d_full_2$outcome <- ifelse(d_full_2$A=='A1',
                           rnorm(nrow(d_full_2), 10, 2),
                           rnorm(nrow(d_full_2), 20, 2))

# SE are not estimable with 1 replicate in the full model
mod_2a <- lm(outcome ~ A * B * C, data = d_full_2)
summary(mod_2a)


##-- Effects
# Option 1
mod_2b <- lm(outcome ~ . ^2, data = d_full_2)
summary(mod_2b)

# Option 2
effects <- abs(coef(mod_2b))[-1]
pareto.chart(effects, main = "Pareto Chart of Effects")


# ------------------------------------------------------------------------------
# Fractional Factorial Design
# ------------------------------------------------------------------------------
# Example 0: A fractional factorial design with 3 runs for three factors (oops!)
d_frac_0 <- FrF2(nruns        = 3, 
               nfactors     = 3, 
               factor.names = fac_names_1)
d_frac_0

# Example 1: A fractional factorial design (2^(3-1)) for three factors
d_frac_1 <- FrF2(nruns        = 4, 
               nfactors     = 3, 
               factor.names = fac_names_1)
d_frac_1

# Add random outcome
d_frac_1$outcome <- rnorm(nrow(d_frac), mean = 10, sd = 2)

# Analyze the design using ANOVA
anova_frac <- aov(outcome ~ A + B + C, data = d_frac_1)
summary(anova_frac)

# Analyze the design using lm (OOps!)
mod_3a <- lm(outcome ~ A * B * C, data = d_frac_1)
mod_3a

# Alias (confounded effect)
aliases(mod_3a)

# Example 2: A fractional factorial design (2^4) for six factors
d_frac_2 <- FrF2(nruns        = 2^4, 
                 nfactors     = 6, 
                 factor.names = fac_names_3)
d_frac_2

# Add non-random outcome (interaction A*B)
nr <- nrow(d_frac_2)
d_frac_2$outcome <- ifelse(d_frac_2$A=='A1' & d_frac_2$B=='B1', rnorm(nr, 10, 2),
                    ifelse(d_frac_2$A=='A1' & d_frac_2$B!='B1', rnorm(nr, 10, 2),
                    ifelse(d_frac_2$A!='A1' & d_frac_2$B=='B1', rnorm(nr, 10, 2),
                                                                rnorm(nr, 20, 2))))

# Some effects are not estimable
mod_4a <- lm(outcome ~ A * B * C * D * E * F, data = d_frac_2)
summary(mod_4a)

# Orthogonal? Yes <-- Rank is 16
qr(mod_4a)$rank 

# Aliases. What resolution? Resolution is 4
aliases(mod_4a)

# Other model
mod_4b <- lm(outcome ~ .^2, data = d_frac_2)
summary(mod_4b)

# Plots
MEPlot(mod_4b)
IAPlot(mod_4b)


# ------------------------------------------------------------------------------
# Latin Square Design
# ------------------------------------------------------------------------------
# Example 1: A 3x3 Latin square with factors A (Batch), B (User), and C (Machine)

# Create the Latin square
d_latin_square <- oa.design(nlevels = c(3, 3, 3), 
                            factor.names = c("Batch", "User", "Machine"))
d_latin_square

# Add non-random outcome (bad batch 1)
d_latin_square$outcome <- ifelse(d_latin_square$Batch=='1', 
                                  rnorm(nr, 10, 2),
                                  rnorm(nr, 20, 2))

# There is no interest in interactions
anova_latin_square <- aov(response ~ Batch + User + Machine, data = d_latin_square)
summary(anova_latin_square)

# ------------------------------------------------------------------------------
# Optimal Design
# ------------------------------------------------------------------------------
# Example 1: Generate an optimal design for estimating effects with 5 factors and 2 levels and 10 runs
data <- gen.factorial(levels=2,nVars=5,center=TRUE,varNames=LETTERS[1:5])
data
set.seed(12345)
d_opt_1 <- optFederov(data=data, nTrials=10)
d_opt_1$design

# Orthogonal? 
qr(d_opt_1$design)$rank 
round(cor(d_opt_1$design),2)

# Example 2: Generate an optimal design for estimating specific effect of a model

# Define the model and constraints
model <- formula(~ A + B + C + A:B)
factors <- expand.grid(A = c(-1, 1), B = c(-1, 1), C = c(-1, 1))

# Generate the optimal design
d_opt_2 <- optFederov(model, factors, nTrials = 6)
d_opt_2$design

# Add outcome
d_opt_2$design$outcome <- rnorm(nrow(d_opt_2$design), mean = 20, sd = 2)

# Orthogonal? 
qr(d_opt_2$design)$rank 
round(cor(d_opt_2$design),2)

# Analyze the design using ANOVA
anova_optim <- aov(outcome ~ A * B, data = d_opt_2$design)
summary(anova_optim)

