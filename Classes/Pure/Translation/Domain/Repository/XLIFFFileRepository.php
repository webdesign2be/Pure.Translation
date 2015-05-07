<?php

namespace Pure\Translation\Domain\Repository;

use TYPO3\Flow\Annotations as Flow;

/**
 * @Flow\Scope("singleton")
 */
class XLIFFFileRepository {

  const PATH_FORMAT = 'resource://%s/Private/Translations/%s/%s.xlf';
  const MAIN_FILE_BASENAME = 'Main';

  /**
   * @Flow\Inject
   * @var \Pure\Translation\Domain\Factory\XLIFFFileFactory
   */
  protected $xliffFileFactory;

  /**
   * Keep Models once they're loaded
   *
   * @var array
   */
  protected $intermediateFileCache = array();

  /**
   * @var \SplObjectStorage
   */
  protected $saveCandidates;

  /**
   * Constructor
   */
  public function __construct() {
    $this->saveCandidates = new \SplObjectStorage();
  }

  /**
   * Find the "Main" translation source per package and locale
   *
   * @param string $packageKey
   * @param string $locale
   * @return \Pure\Translation\Domain\Model\XLIFFFile
   */
  public function findMainByPackageKeyAndLocale($packageKey, $locale) {
    return $this->findOneByPackageKeyAndLocaleAndSourceName($packageKey, $locale, self::MAIN_FILE_BASENAME);
  }

  /**
   * Find a translation source per package, locale and source name
   *
   * @param string $packageKey
   * @param string $locale
   * @param string $sourceName
   * @return \Pure\Translation\Domain\Model\XLIFFFile
   */
  public function findOneByPackageKeyAndLocaleAndSourceName($packageKey, $locale, $sourceName) {
    if (!isset($this->intermediateFileCache[$packageKey . $locale . $sourceName])) {
      $fileName = sprintf(self::PATH_FORMAT, $packageKey, $locale, $sourceName);

      if (!file_exists($fileName)) {
        return NULL;
      }

      $this->intermediateFileCache[$packageKey . $locale . $sourceName] =
        $this->xliffFileFactory->createFromFile($fileName);
    }

    return $this->intermediateFileCache[$packageKey . $locale . $sourceName];
  }

  /**
   * Mark an XLIFFFile for later persistance
   *
   * @return \Pure\Translation\Domain\Repository\XLIFFFileRepository
   */
  public function add(\Pure\Translation\Domain\Model\XLIFFFile $xliffFile) {
    $this->saveCandidates->attach($xliffFile);
    return $this;
  }

  /**
   * Save changes to all XLIFFFiles
   *
   * @return \Pure\Translation\Domain\Repository\XLIFFFileRepository
   */
  public function persistAll() {
    foreach ($this->saveCandidates as $xliffFile) {
      $fileName = $xliffFile->getFileName();
      $xml = $xliffFile->getDocument()->saveXML();

      file_put_contents($fileName, $xml);
    }

    return $this;
  }

}
