package com.esigelec.ehpad_backend.entity;

/** Fonction d'un soignant : l'infirmier donne les médicaments, l'aide-soignant s'occupe des repas et des soins. */
public enum Job {
    INFIRMIER,
    AIDE_SOIGNANT,
    /** Service en salle à manger : sert les repas aux tables, ne s'occupe pas des soins ni des médicaments. */
    SERVICE
}
