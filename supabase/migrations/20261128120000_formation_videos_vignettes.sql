-- ============================================================
-- Studia Academy — vignettes des vidéos de présentation
--
-- Le bucket `formation-videos` accepte aussi les images JPEG : à l'envoi
-- d'une vidéo, l'écran d'administration y dépose une capture de la vidéo
-- (même chemin, extension .jpg), affichée comme vignette tant que la
-- vidéo n'est pas lancée.
-- Seule la liste des formats acceptés change ; les règles d'accès
-- (lecture publique, écriture admin) et les fichiers restent tels quels.
-- ============================================================

update storage.buckets
   set allowed_mime_types = array['video/mp4', 'video/webm', 'image/jpeg']
 where id = 'formation-videos';
