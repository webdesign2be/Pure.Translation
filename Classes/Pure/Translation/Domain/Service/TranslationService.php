<?php

namespace Pure\Translation\Domain\Service;

use TYPO3\Flow\Annotations as Flow;
use TYPO3\Neos\Exception as NeosException;

/**
 * A simple service that helps retrieving site package translations
 *
 * @Flow\Scope("singleton")
 */
class TranslationService {

  /**
   * @Flow\Inject
   * @var \TYPO3\Flow\I18n\Translator
   */
  protected $translator;

  /**
   * @Flow\Inject
   * @var \TYPO3\Flow\Package\PackageManagerInterface
   */
  protected $packageManager;

  /**
   * @Flow\InjectConfiguration(package="TYPO3.TYPO3CR", path="contentDimensions.language.presets")
   * @var array
   */
  protected $languageDimensionPresets;

  /**
   * @Flow\Inject
   * @var \TYPO3\Neos\Service\XliffService
   */
  protected $xliffService;

  /**
   * Internal runtime cache for all translations
   * @var array
   */
  protected $allTranslations = NULL;

  /**
   * Get all avaible translations that can be found
   * in site packages
   *
   * @param $packageTypeFilter Specify the type of packages that should be considered
   * @param string $sourceName The source catalog to use
   * @return array
   * @throws NeosException
   */
  public function retrieveAll($packageTypeFilter = 'typo3-flow-site', $sourceName = 'Main') {
    if (NULL === $this->allTranslations) {
      if ($this->languageDimensionPresets !== NULL) {
        $translations = array(
          'list' => array()
        );
        $packages = $this->packageManager->getFilteredPackages('available', NULL, $packageTypeFilter);

        $listIterator = 0;
        foreach ($packages as $packageKey => $package) {

          $localeIndex = 0;
          foreach ($this->languageDimensionPresets as $presetIdentifier => $preset) {
            if (!is_array($preset) || !is_array($preset['values'])) {
              continue;
            }

            $currentlyUsedLocaleCode = $preset['values'][0];
            $currentlyUsedLocale = new \TYPO3\Flow\I18n\Locale($currentlyUsedLocaleCode);

            try {
              $xliffSourceData = $this->xliffService->getCachedJson($currentlyUsedLocale, $sourceName, $package->getPackageKey());
            } catch(\TYPO3\Flow\I18n\Exception\InvalidXmlFileException $e) {
              $translations = NULL;
              continue;
            }

            // \TYPO3\Flow\var_dump();die;

            $xliffData = json_decode(
              $xliffSourceData,
            true);

            foreach ($xliffData as $vendor) {
              foreach ($vendor as $product) {
                foreach ($product as $sourceName => $translationUnit) {
                  foreach ($translationUnit as $identifier => $value) {
                    $translation = array(
                      'packageKey' => $packageKey,
                      'locale' => $currentlyUsedLocaleCode,
                      'sourceName' => $sourceName,
                      'identifier' => $identifier,
                      'value' => $value
                    );

                    $translations['list'][++$listIterator] = $translation;

                    // Build Indexes
                    $translations['Package:Locale:Identifier'][$packageKey][$currentlyUsedLocaleCode][$identifier] =
                    $translations['Package:Identifier:Locale'][$packageKey][$identifier][$currentlyUsedLocaleCode] =
                    $translations['Locale:Package:Identifier'][$currentlyUsedLocaleCode][$packageKey][$identifier] =
                    $translations['Locale:Identifier:Package'][$currentlyUsedLocaleCode][$identifier][$packageKey] =
                    $translations['Identifier:Package:Locale'][$identifier][$packageKey][$currentlyUsedLocaleCode] =
                    $translations['Identifier:Locale:Package'][$identifier][$currentlyUsedLocaleCode][$packageKey] =
                    $translations['Locale:Identifier'][$currentlyUsedLocaleCode][$identifier] =
                    $translations['Identifier:Locale'][$identifier][$currentlyUsedLocaleCode] =
                    $translations['Identifier:LocaleNumeric'][$identifier][$localeIndex] =
                      &$translations['list'][$listIterator];
                  }
                }
              }
            } // XLIFF Iteration

            $localeIndex++;
          } // Dimension Iteration
        } // Package Iteration
      } else {
        $translations = NULL;
      }

      $this->allTranslations = $translations;
    }

    return $this->allTranslations;
  }

  /**
   * Get all translation and group them by package
   *
   * @return array
   */
  public function retrieveAllGroupedByPackage() {
    $this->retrieveAll();
    return $this->allTranslations !== NULL ? $this->allTranslations['Package:Locale:Identifier'] : NULL;
  }

  /**
   * Get all translation and group them by locale
   *
   * @return array
   */
  public function retrieveAllGroupedByLocale() {
    $this->retrieveAll();
    return $this->allTranslations !== NULL ? $this->allTranslations['Locale:Package:Identifier'] : NULL;
  }

  /**
   * Get all translation and group them by locale without
   * grouping them by package too
   *
   * @return array
   */
  public function retrieveAllGroupedByLocaleOnly() {
    $this->retrieveAll();
    return $this->allTranslations !== NULL ? $this->allTranslations['Locale:Identifier'] : NULL;
  }

  /**
   * Get all translation and group them by locale without
   * grouping them by package too
   *
   * @return array
   */
  public function retrieveAllGroupedByIdentifierAndLocale() {
    $this->retrieveAll();
    return $this->allTranslations !== NULL ? $this->allTranslations['Identifier:Locale'] : NULL;
  }

  /**
   * Get all translation and group them by locale without
   * grouping them by package too
   *
   * @return array
   */
  public function retrieveAllGroupedByIdentifierAndHavingNumericLocale() {
    $this->retrieveAll();
    return $this->allTranslations !== NULL ? $this->allTranslations['Identifier:LocaleNumeric'] : NULL;
  }

  /**
   * Get all translation for the given locale
   *
   * @param string $localeCode Identifies the locale in question
   * @return array|null
   */
  public function retrieveAllForLocale($localeCode) {
    $this->retrieveAll();
    return isset($this->allTranslations['Locale:Identifier'][$localeCode]) ?
      $this->allTranslations['Locale:Identifier'][$localeCode] : array();
  }

  /**
   * Get all translations for the given identifier
   *
   * @param string $identifier
   * @return void
   */
  public function retrieveAllForIdentifier($identifier) {
    $this->retrieveAll();
    return isset($this->allTranslations['Identifier:Locale'][$identifier]) ?
      $this->allTranslations['Identifier:Locale'] : array();
  }

  /**
   * Get all translations for the given package
   *
   * @param string $packageKey Identifies the packages in question
   * @return array
   */
  public function retrieveAllForPackage($packageKey) {
    $this->retrieveAll();
    return (isset($this->allTranslations['Package:Locale:Identifier'][$packageKey])) ?
      $this->allTranslations['Package:Locale:Identifier'][$packageKey] : array();
  }

  /**
   * Get a single translation
   *
   * @param string $localeCode Identifies the locale in question
   * @param string $identifier
   * @return array
   */
  public function retrieveOne($localeCode, $identifier) {
    return $this->translationExists($localeCode, $identifier) ?
      $this->allTranslations['Locale:Identifier'][$localeCode][$identifier] : array();
  }

  /**
   * Get all available locales
   *
   * @return array
   */
  public function getAllLocales() {
    $result = array();
    if ($this->languageDimensionPresets !== NULL) {
      foreach ($this->languageDimensionPresets as $preset) {
        if (is_array($preset) && is_array($preset['values'])) {
          $result[] = $preset['values'][0];
        }
      }
    }

    return $result;
  }

  /**
   * Check whether there are any translations for the given locale
   *
   * @param string $localeCode Identifies the language in question
   * @return boolean
   */
  public function languageExists($localeCode) {
    foreach ($this->languageDimensionPresets as $preset) {
      if (is_array($preset) && is_array($preset['values']) && in_array($localeCode, $preset['values'])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check whether a certain string is translated in the given locale
   *
   * @param string $localeCode Identifies the locale in question
   * @param string $identifier
   * @return boolean
   */
  public function translationExists($localeCode, $identifier) {
    $this->retrieveAll();
    return isset($this->allTranslations['Locale:Identifier'][$localeCode]) &&
           isset($this->allTranslations['Locale:Identifier'][$localeCode][$identifier]);
  }
}
